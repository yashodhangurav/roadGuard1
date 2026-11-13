import time
import json
import logging
from typing import List, Dict, Any, Optional
import httpx

from app.core.config import settings
from app.schemas.detection import DetectedDefect, RoadDamageStats
from app.schemas.ai import (
    ExplainResponse,
    RecommendResponse,
    RecommendationItem,
    ChatMessage,
    ChatResponse,
)

logger = logging.getLogger(__name__)

SYSTEM_PROMPT_EXPLAIN = """You are RoadSentinel AI's Senior Civil & Highway Infrastructure Assistant.
Your job is to provide professional, concise technical explanations of verified road damage detections.

STRICT CONSTRAINTS:
1. ONLY reference the verified defects, severities, and metrics provided in the prompt.
2. NEVER invent detections, coordinates, confidence scores, or statistics.
3. NEVER claim an image reveals actual physical pothole depth (2D optical images only capture shadow/contrast proxies, not true 3D volumetric depth).
4. Clearly state engineering uncertainty when discussing pavement substructure.
5. Keep your tone objective, professional, and actionable for municipal highway engineers.
"""

class OllamaService:
    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL.rstrip("/")
        self.model = settings.OLLAMA_MODEL
        self.timeout = settings.OLLAMA_TIMEOUT

    async def _query_ollama(self, prompt: str, system_prompt: str = "") -> str:
        """Sends a completion request to local Ollama runtime."""
        payload = {
            "model": self.model,
            "prompt": prompt,
            "system": system_prompt,
            "stream": False,
            "options": {
                "temperature": 0.2,  # Low temperature for factual consistency
                "num_predict": 512,
            }
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(f"{self.base_url}/api/generate", json=payload)
                if response.status_code == 200:
                    data = response.json()
                    return data.get("response", "").strip()
                else:
                    logger.warning(f"Ollama returned status {response.status_code}: {response.text}")
                    return ""
            except Exception as e:
                logger.error(f"Failed to communicate with Ollama at {self.base_url}: {e}")
                return ""

    async def explain_defects(
        self,
        defects: List[DetectedDefect],
        stats: Optional[RoadDamageStats],
        location_context: str = "Urban Arterial Roadway"
    ) -> ExplainResponse:
        """Generates grounded technical explanation for verified road damage."""
        total_defects = len(defects)
        disclaimer = "Optical 2D imagery provides surface morphology and shadow contrast proxies; true cavity depth and substructure integrity require geotechnical core sampling or 3D LIDAR profiling."

        if total_defects == 0:
            return ExplainResponse(
                explanation="No actionable surface defects or hazardous potholes were detected in the inspected pavement segment. The surface appears structurally uniform.",
                damageSummary="Clear roadway with no significant surface distress.",
                safetyRisks=["Routine environmental wear monitoring recommended."],
                urgencyAssessment="Standard cyclical maintenance schedule (annual survey).",
                disclaimer=disclaimer,
                model=self.model,
            )

        defect_summary_lines = []
        for d in defects:
            defect_summary_lines.append(
                f"- ID: {d.id} | Type: {d.type} | Severity: {d.severity} ({d.severity_score}/100) | "
                f"Confidence: {d.confidence}% | Surface Area: ~{d.dimensions.areaCm2} cm² | "
                f"Urgency: {d.urgency} | Repair: {d.repairMethod}"
            )
        defect_text = "\n".join(defect_summary_lines)

        condition = stats.overallCondition if stats else "Degraded"
        pci = stats.pciScore if stats else 50.0

        prompt = f"""Location: {location_context}
Overall Pavement Condition: {condition} (Estimated PCI: {pci}/100)
Total Verified Defects: {total_defects}

Verified Damage Inventory:
{defect_text}

Provide:
1. A concise technical summary of the road segment distress.
2. Direct vehicle safety hazards posed by these specific defects (e.g. tire rim impact, vehicle swerving, water hydroplaning).
3. Recommended inspection urgency.
Keep the total response under 150 words.
"""

        llm_response = await self._query_ollama(prompt, system_prompt=SYSTEM_PROMPT_EXPLAIN)

        # Fallback if Ollama is unreachable
        if not llm_response:
            critical_items = [d for d in defects if d.severity in ["Critical", "High"]]
            highest_urgency = "Immediate" if any(d.severity == "Critical" for d in defects) else "Priority (48h)"
            llm_response = (
                f"Pavement inspection identified {total_defects} surface defect(s) on this {location_context}. "
                f"{len(critical_items)} defect(s) exhibit elevated severity requiring {highest_urgency.lower()} intervention. "
                f"Primary defects consist of {', '.join(set(d.type for d in defects))}. "
                f"Prompt sealing and patch compaction are advised to prevent water ingress into the base course."
            )

        # Deterministic safety risk identification
        safety_risks = []
        if any(d.type == "Pothole" and d.severity in ["Critical", "High"] for d in defects):
            safety_risks.append("High risk of wheel rim deformation, tire blowout, and sudden vehicle swerving.")
        if any(d.type == "Pothole" for d in defects):
            safety_risks.append("Cavity water accumulation leading to pavement base softening and accelerated freeze-thaw spalling.")
        if any("Crack" in d.type for d in defects):
            safety_risks.append("Moisture percolation through crack fissures deteriorating subgrade structural load capacity.")
        if not safety_risks:
            safety_risks.append("Progressive pavement surface degradation if routine preventative sealing is omitted.")

        highest_urgency = "Monitor"
        if any(d.urgency == "Immediate" for d in defects):
            highest_urgency = "Immediate (Emergency Intervention within 24 Hours)"
        elif any(d.urgency == "Priority (48h)" for d in defects):
            highest_urgency = "Priority (Repair Dispatch within 48 Hours)"
        elif any(d.urgency == "Routine" for d in defects):
            highest_urgency = "Routine Maintenance (Schedule with District Work Crew)"

        return ExplainResponse(
            explanation=llm_response,
            damageSummary=f"{total_defects} verified defect(s) identified with {condition} pavement rating.",
            safetyRisks=safety_risks,
            urgencyAssessment=highest_urgency,
            disclaimer=disclaimer,
            model=self.model,
        )

    async def generate_recommendations(
        self,
        defects: List[DetectedDefect],
        stats: Optional[RoadDamageStats],
        road_type: str = "Asphalt Concrete",
        weather_condition: str = "Dry"
    ) -> RecommendResponse:
        """Calculates deterministic repair schedule and cost with LLM engineering synthesis."""
        items: List[RecommendationItem] = []
        total_cost = 0.0

        for d in defects:
            if d.severity == "Critical":
                labor_hrs = 3.5
                cost = 450.0 + (d.dimensions.areaCm2 * 0.05)
                materials = "Dense-graded hot-mix asphalt (HMA), cationic rapid-setting tack emulsion (CRS-2)"
                equip = "Skid-steer road planer, pneumatic breaker, vibrating plate compactor, asphalt hot box"
            elif d.severity == "High":
                labor_hrs = 2.0
                cost = 280.0 + (d.dimensions.areaCm2 * 0.03)
                materials = "Hot-mix asphalt patch compound, rubberized asphalt edge sealant"
                equip = "Asphalt milling saw, portable compactor, hand leveling lute"
            elif d.severity == "Medium":
                labor_hrs = 1.0
                cost = 140.0 + (d.dimensions.areaCm2 * 0.015)
                materials = "Polymer-modified cold patch asphalt, bituminous crack sealant"
                equip = "High-pressure air wand, hand tamper"
            else:
                labor_hrs = 0.5
                cost = 65.0
                materials = "Hot-poured elastomeric joint sealant (ASTM D6690)"
                equip = "Melt kettle applicator, squeegee wand"

            total_cost += cost
            items.append(RecommendationItem(
                defectId=d.id,
                type=d.type,
                priority=d.urgency,
                repairMethod=d.repairMethod,
                materialsNeeded=materials,
                estimatedLaborHours=labor_hrs,
                equipmentNeeded=equip,
            ))

        total_labor = sum(item.estimatedLaborHours for item in items)
        patch_tons = stats.estimatedPatchTons if stats else round(len(defects) * 0.25, 2)

        prompt = f"""Road Surface: {road_type}
Weather Setting: {weather_condition}
Defects to address: {len(defects)}
Total Estimated Material: {patch_tons} metric tons
Total Labor Hours: {total_labor} hours

Write a 2-3 sentence technical dispatch note for the maintenance superintendent specifying crew sequencing and traffic management during repairs.
"""
        summary = await self._query_ollama(prompt, system_prompt=SYSTEM_PROMPT_EXPLAIN)
        if not summary:
            summary = (
                f"Mobilize a road maintenance crew with {patch_tons} tons of asphalt mix. "
                f"Establish temporary lane closure with advance warning signage, execute edge-milling on severe cavities, "
                f"apply tack coat bonding, and compact patch layers in 50mm lifts to restore ride quality."
            )

        return RecommendResponse(
            recommendations=items,
            engineeringSummary=summary,
            estimatedTotalCostUsd=round(total_cost, 2),
            model=self.model,
        )

    async def chat(
        self,
        query: str,
        history: List[ChatMessage],
        inspection_context: Optional[Dict[str, Any]] = None
    ) -> ChatResponse:
        """Interactive contextual assistant for municipal highway queries."""
        context_str = ""
        if inspection_context:
            context_str = f"\nCurrent Active Inspection Context:\n{json.dumps(inspection_context, indent=2)}\n"

        prompt = f"""{context_str}
User Query: {query}

Provide a helpful, precise, civil engineering response. If the query asks about data not present in the inspection context, clearly state that rather than fabricating values.
"""
        reply = await self._query_ollama(prompt, system_prompt=SYSTEM_PROMPT_EXPLAIN)
        if not reply:
            reply = "I am RoadSentinel AI. Our computer vision system inspects pavement distress and severity using verified YOLOv8 models. Please let me know how I can assist with inspection reports or repair planning."

        return ChatResponse(
            reply=reply,
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            model=self.model,
        )

# Global service instance
ollama_service = OllamaService()

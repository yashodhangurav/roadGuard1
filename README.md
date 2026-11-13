# RoadGuard AI — AI-Based Road Damage and Pothole Detection System

> **Detect it. Map it. Fix it.**  
> *Intelligent Road Monitoring. Safer Roads.*

Transforming road images and videos into actionable infrastructure intelligence using AI-powered road damage and pothole detection.

---

## 📖 Project Documentation

- **[DESIGN_TOKENS.md](./frontend/DESIGN_TOKENS.md)**: Extracted design system, colors, typography scales, container query mechanics, and motion easing tokens.
- **[REFERENCE_ANALYSIS.md](./frontend/REFERENCE_ANALYSIS.md)**: Full reverse-engineering inspection report of the reference website architecture.
- **[ROADGUARD_DESIGN_MAPPING.md](./frontend/ROADGUARD_DESIGN_MAPPING.md)**: Section-by-section product mapping specification for RoadGuard AI.

---

## 🚀 Tech Stack

- **Frontend:** React 18 + TypeScript + Vite 6
- **Styling:** Tailwind CSS + Custom CSS Design Tokens
- **Animations:** Framer Motion + Custom Spring Physics
- **Icons:** Lucide React
- **Visualization:** Recharts + Leaflet / React Leaflet

---

## 🛠️ Getting Started

```bash
cd frontend
npm install
npm run dev
```

To build for production:

```bash
npm run build
npm run preview
```

---

## 🏛️ Architecture Overview

- **01. Detection:** Computer vision model identifying potholes, cracks, and road surface deterioration.
- **02. Mapping:** Sub-meter GIS geocoding and spatial clustering along road corridors.
- **03. Analysis:** Optical noise filtering (shadows, puddle glare) and ASTM D6433 Pavement Condition Index (PCI) scoring.
- **04. Resolution:** Automated municipal work-order dispatch with asphalt tonnage estimations.


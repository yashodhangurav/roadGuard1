# RoadGuard AI — Design & Section Mapping Specification

> **Source Reference:** [aloud.sh](https://www.aloud.sh/) (Reverse-engineered in [REFERENCE_ANALYSIS.md](file:///Users/yashodhan/Documents/Projects/roadguard/REFERENCE_ANALYSIS.md) and [DESIGN_TOKENS.md](file:///Users/yashodhan/Documents/Projects/roadguard/DESIGN_TOKENS.md))  
> **Target Project:** RoadGuard AI — AI-Based Road Damage and Pothole Detection System  
> **Brand Tagline:** *Detect it. Map it. Fix it.*  
> **Core Principle:** Complete structural, proportional, layout, and interaction parity with the reference design, updating exclusively the product identity, copywriting, illustrations, interactive mockups, and telemetry assets.

---

## 1. Architectural Strategy & Preservation Rules

1. **Strict Sequence Preservation:** Every section, header, modal, and footer from the reference is preserved in exact ordinal sequence.
2. **Visual Hierarchy & Token Parity:**
   - Background canvas: `#0a0a0a` with `#121212` / `#181818` card surfaces.
   - Accent palette: Retain the terracotta/orange accent (`--claude: #d97757` re-mapped to `--accent-amber: #e07a5f` or high-visibility infrastructure safety amber `#d97757`) for warnings, bounding box highlights, and CLI indicators.
   - Text hierarchy: Exact Geist Sans / Geist Mono typography scales, line heights, and negative letter-spacing (`-0.058em` on hero, `-0.045em` on `h2`).
   - Max width: Fixed `--wrap: 1200px` (total container `1248px` including `24px` gutter).
3. **No Generic Admin Clutter:** The page remains an elite, dark-mode software product showcase rather than a utilitarian dashboard table. Every complex concept is conveyed through spatial craft, interactive physics, live canvas renders, and fluid before/after sliders.

---

## 2. Global Section Mapping Matrix

| Ref Section | Aloud.sh Original | RoadGuard AI Equivalent | Key Interactive & Visual Mechanics |
| :--- | :--- | :--- | :--- |
| **0. Nav** | Fixed Nav + Progressive Blur + "Watch the film" scroll reveal | Fixed Nav + Progressive Blur + "View Live Demo" scroll reveal | 5-stage progressive blur, dynamic `.is-scrolled`, dynamic `.is-past` expansion |
| **1. Hero** | "Say it. Ship it." + Speech capture app + Voice note floating bar | "Detect it. Map it. Fix it." + Real-time Edge Dashcam HUD + Telemetry Floating Bar | Fluid gradient headline, retina landscape glow, magnetic spring bar, audio meter $\to$ sensor frequency bars |
| **2. Act 01** | **01 Say it** ("Aloud knows what you mean by 'this'") + SVG circle loops | **01 Detection** ("RoadGuard AI spots what drivers miss") + Pothole bounding boxes & polygon masks | Animated SVG pen loop around potholes, corner-handled crop bounding boxes, 3-column sub-grid |
| **3. Act 02** | **02 Sort it** ("Everything you capture lands in one place") + Desk note clustering | **02 Mapping** ("Every defect pinned to the global grid") + GIS Spatial Map clustering | Asymmetric split cards, spatial cluster grouping, route telemetry ticker |
| **4. Act 03** | **03 Shape it** ("'Wait, no, scrap that.' Got it.") + Speech Diff + Workflow Tabs | **03 Analysis** ("'Is that a puddle or a pothole?' Solved.") + Telemetry Diff + AI Taxonomy Tabs | Strikethrough of false positives (shadows, puddle reflections), 5-tab auto-timer tablist (6.5s progress bar) |
| **5. Act 04** | **04 Ship it** ("Your agent gets the plan") + Terminal CLI + Before/After Compare Slider | **04 Resolution** ("Your road crews get the work order") + Municipal Dispatch CLI + Road Repair Slider | Interactive terminal ("Press Enter to dispatch"), animated spinner, interactive before/after repair drag slider |
| **6. Details**| "And the rest, done properly" + 6 Spotlight Tiles | "And the infrastructure, built to standard" + 6 Spotlight Tiles | Pointer-tracking radial mouse spotlight (`--mx`, `--my`) across 6 civil engineering capabilities |
| **7. Privacy**| "Your voice stays on your Mac" + 3 Metric Pillars | "Road data stays sovereign. Driver privacy protected." + 3 Pillars | 2-column asymmetric grid, edge face/plate anonymization, 3 metric definition pillars |
| **8. FAQ** | 9 `<details>` disclosures on software, Whisper, and costs | 9 `<details>` disclosures on computer vision, PCI standards, and GIS | Smooth CSS `::details-content` transition, rotating plus/cross icon (`rotate(45deg)`) |
| **9. CTA** | "Next time, just say it" + Generative Harmonic Sine Wave Canvas | "Safer roads begin with a single scan." + Road Surface Vibration Wave Canvas | Real-time 30-line harmonic sine wave simulation on HTML5 `<canvas>`, embossed radar shield icon |
| **10. Dialog**| `<dialog id="film">` Watch the film 1:00 modal | `<dialog id="film">` View Live Demo 1:20 modal | HTML5 native modal, backdrop blur, keyboard escape, auto-pause |
| **11. Foot** | 4-Column Footer (Brand, Aloud, Studio, More) | 4-Column Footer (Brand, Platform, Solutions, Standards) | Grid layout, civic infrastructure badge, copyright and legal navigation |

---

## 3. Detailed Section-by-Section Engineering Blueprint

### 3.1 Global Navigation Bar (`<header id="nav" class="nav">`)

#### Visual Structure
* **Container:** Fixed at top, height `64px`, `max-width: 1248px` inner flex layout.
* **Backdrop Filter:** 5-layer stacked pseudo-elements (`.nav-blur i:nth-child(1..5)`) generating non-linear progressive frosted blur from `blur(1px)` to `saturate(1.4) blur(18px)`.
* **Left Brand:** RoadGuard AI logo mark — polished radar/shield geometry in SVG + typography `Geist Sans` semi-bold.
* **Center Links:** `<nav class="nav-links">`
  * "Detection" (`#detection`)
  * "Mapping" (`#mapping`)
  * "Analysis" (`#analysis`)
  * "FAQ" (`#faq`)
* **Right Actions (`.nav-cta`):**
  * **Secondary Button (`.nav-watch`):** Hidden initially (`max-width: 0`, `opacity: 0`). When scrolled past the hero section, expands to `max-width: 180px` displaying Play icon + "View Live Demo".
  * **Primary CTA:** `.btn .btn-light .btn-sm` with Radar/Eye icon + "Explore Detection".

---

### 3.2 Hero Section (`<section id="top" class="hero">`)

#### Copy & Content
* **Eyebrow / Badge:** *Autonomous Pavement Intelligence*
* **Headline (`.hero-title`):**
  ```html
  <h1 class="hero-title">Detect it. Map it. Fix it.</h1>
  ```
  *Styling:* `clamp(60px, 10.4vw, 124px)`, weight `400`, letter-spacing `-0.058em`, line-height `0.98`, linear gradient text clip `#ffffff 34%` to `#9d9d9d 100%`.
* **Lede Paragraph (`.hero-lede`):**
  > Transform road images and videos into actionable infrastructure intelligence using AI-powered road damage detection.
  *Styling:* `clamp(17px, 1.7vw, 20px)`, max-width `640px`, text color `--text-2` (`#8f8f8f`), `text-wrap: balance`.
* **Action Buttons (`.hero-actions`):**
  * Primary: `<a class="btn btn-light btn-lg" href="#detection">` — Eye/Radar icon + **"Explore Detection"**.
  * Secondary: `<button class="btn btn-ghost btn-lg film-link">` — Play icon + **"View Live Demo"** + `<span class="btn-note">1:20</span>`.
* **Specification Pills (`.hero-meta`):**
  * `Edge Vision` · `Real-Time 60 FPS` · `Sub-meter GPS` · `Model v4.2`
  * Rendered in `Geist Mono` at `12.5px`, separated by middle dots (`·`).

#### Hero Stage & Product Demonstration
* **Atmospheric Backdrop:**
  * `.hero-sky`: Dual radial gradient glow (`rgba(255, 255, 255, 0.085)` down to `transparent`).
  * `.hero-glow`: Dark asphalt/topography landscape mesh at `top: 36%` with `width: max(1800px, 150vw)`.
* **Main Mockup Frame (`.hero-window.window`):**
  * Desktop edge console window (`1203px` base aspect ratio, `container-type: inline-size`).
  * **Base Video HUD Viewport:** High-definition forward-facing vehicle dashcam feed navigating an urban road.
  * **Live Computer Vision Overlay:**
    * Real-time bounding box `[Pothole · 98.4% · Depth: 68mm]` with animated corner brackets.
    * Longitudinal crack segmentation polygon with severity index badge `[Severity: High]`.
    * Telemetry HUD displaying vehicle velocity (`42 km/h`), GPS coordinate lock, and defect counter (`14 detected on route`).
* **Interactive Floating Detection Bar (`.bar.bar-hero`):**
  * Styled as the iconic floating white pill (`background: #ffffff`, text `#1a1a1a`, shadow `0 30px 80px -10px rgba(0,0,0,0.75)`).
  * **Pointer Physics:** Sub-pixel magnetic spring interpolation following pointer within 220px radius.
  * **Radar Ping Icon:** Pulsing radar scanner with radiating ring keyframe animation (`mic-ping` equivalent).
  * **Sensor Frequency Bars (`.bar-bars i`):** Dynamic height oscillation simulating road surface vibration / LiDAR returns.
  * **Telemetry Status Clock:** Live latitude/longitude ticker (`37°46'29"N 122°25'10"W`).
  * **Interactive Speech/Telemetry Bubble (`.bar-caption`):** Clicking the bar triggers simulated live detection readouts with synchronized word highlighting:
    > *"Severe pothole detected at MP 14.2 · Depth 7.2 cm · Logged to Zone 4 Municipal Repair Queue"*

---

### 3.3 Section 01: Detection (`<section id="detection" class="act">`)
*(Mapped from Aloud Section 01: "Say it")*

#### Visual Narrative & Hierarchy
* **Step Eyebrow (`.step`):** Box badge `<span class="step-n">01</span>` + `<span class="step-label">Detection</span>`.
* **Headline (`.h2`):**
  ```html
  <h2 class="h2">RoadGuard AI spots what drivers miss</h2>
  ```
* **Lede (`.lede`):**
  > Detect potholes, cracks, surface deterioration and damaged road areas using computer vision. Process high-speed dashcam feeds, mobile camera frames, and drone aerials in real time — with zero human lag.

#### Product Demonstration Canvas
* **Staging Highway Asset (`.sb-window`):** High-resolution road surface frame showing complex multi-defect asphalt.
* **Animated Annotation Primitives:**
  * **Dynamic Pen Circle (`.mk-loop`):** Animated SVG path with `stroke-dasharray` / `stroke-dashoffset` tracing a freehand circle around a dangerous crater.
  * **Detection Tag (`.mk-label`):** Floating pill badge: `[Warning Icon] Severe Pothole · Depth 72mm · Volume 0.12m³`.
  * **Bounding Selection Area (`.mk-area`):** Scaled bounding box with corner brackets framing alligator fatigue cracks.
  * **Dimension Tag (`.mk-dims`):** Monospace dimension pill: `840mm × 520mm`.

#### Sub-feature Grid (`.grid-3`)
1. **Millimeter-level Framing (`.card`):**
   * *Icon:* Crop / Target SVG.
   * *Copy:* Polygon masks, depth estimation, and geometric bounding boxes generated on the fly. Bounding vectors snap tightly to damaged asphalt edges.
2. **Dashcam, Mobile, or Drone (`.card`):**
   * *Icon:* Camera / Drone SVG.
   * *Copy:* Ingest 4K dashcam streams, mobile phone camera mounts, or georeferenced orthomosaic drone surveys without specialized hardware.
3. **Sub-second Edge Inference (`.card`):**
   * *Icon:* Processor Chip SVG.
   * *Copy:* `<kbd>60</kbd><kbd>FPS</kbd>` on-device YOLO vision model runs offline on Jetson, Ambarella, or mobile neural engines.

---

### 3.4 Section 02: Mapping (`<section id="mapping" class="act">`)
*(Mapped from Aloud Section 02: "Sort it")*

#### Visual Narrative & Hierarchy
* **Step Eyebrow (`.step`):** `<span class="step-n">02</span>` + `Mapping`.
* **Headline (`.h2`):**
  ```html
  <h2 class="h2">Every defect pinned to the global grid</h2>
  ```
* **Lede (`.lede`):**
  > Display detected road defects on a geographical map with location and severity information. RoadGuard AI geo-tags every anomaly with sub-meter GNSS coordinates, clustering repairs onto GIS layers so road crews plan optimal routes.

#### Interactive Spatial Desk (`#desk`)
* **Asymmetric Split Grid (`.split`):** `1.38fr` to `1fr`.
* **Canvas Backdrop:** Dark cartographic vector/satellite tile grid texture with contour lines and highway route markers.
* **Left Card (Spatial Clustering Stack):**
  * Displays stacked defect capture cards along a surveyed corridor (Route 101).
  * Each card shows thumbnail crop, GPS stamp, velocity at capture, and defect classification.
* **Right Card (Consolidated Cluster Card):**
  * Shows automated clustering: 6 individual pothole captures merged into a single repaving zone work-order with estimated asphalt requirements.
* **Floating GIS Telemetry Bar (`.bar.bar-desk`):**
  * Live satellite lock status (`12 Satellites · RTK Fixed · Accuracy ±0.04m`).
  * Defect tally ticker updating in real-time.

---

### 3.5 Section 03: Analysis (`<section id="analysis" class="act">`)
*(Mapped from Aloud Section 03: "Shape it")*

#### Visual Narrative & Hierarchy
* **Step Eyebrow (`.step`):** `<span class="step-n">03</span>` + `Analysis`.
* **Headline (`.h2`):**
  ```html
  <h2 class="h2">“Is that a puddle or a pothole?” Solved.</h2>
  ```
* **Lede (`.lede`):**
  > Show defect classification, confidence scores, severity and road condition analytics. Raw road video is full of shadows, wet asphalt reflections, and tire marks. RoadGuard AI strips optical noise, computes true crater depth, and turns chaotic imagery into audited engineering data.

#### Component 1: Telemetry Diff Inspector (`#diff`)
* **3-Column Architecture:** Left (Raw Sensor Noise) $\to$ Center (`->`) $\to$ Right (Verified Engineering Data).
* **Left Column ("Raw Sensor Ingestion" · 8 stream events · 60 FPS Camera):**
  * Struck-through text lines animated on scroll:
    * `<s>Overhead bridge shadow</s>` (Filtered as illumination artifact)
    * `<s>Standing water puddle</s>` (Disparity checked: flat surface, zero depth)
    * `<s>Dark tire skid mark</s>` (Texture analysis: intact pavement matrix)
    * `<s>Dry fallen leaves cluster</s>` (Classified as transient debris)
    * `<u>Transverse fatigue crack — Depth verified via stereo disparity</u>` (Dotted underline)
    * `<u>Sub-surface pothole depression — 64mm vertical void</u>` (Dotted underline)
* **Right Column ("Verified Telemetry" · 4 auditable work items):**
  * Structured defect matrix:
    1. Severe Pothole #104: Depth 64mm, Volume 0.14 m³, PCI deduct: 28 pts.
    2. Transverse Crack #105: Length 2.4m, Width 14mm, Medium Severity.
* **Diff Legend (`.diff-key`):**
  * `<s>` Filtered optical artifacts (shadows, water reflections, debris)
  * `<u>` Stereo depth-verified structural pavement failures

#### Component 2: AI Vision Models Tablist (`#flows`)
* **Subhead:** "Four specialized neural models, and custom municipal classifiers"
* **Tablist (`role="tablist"`):** 5 pill tabs:
  1. **Pothole Segmenter** (Target / Scanner icon)
  2. **Crack Classifier** (Fracture line icon)
  3. **Depth Profiler** (Stereo Disparity / 3D icon)
  4. **PCI Calculator** (Chart / ASTM D6433 icon)
  5. **Custom Rules** (Sliders / Municipal parameters icon)
* **Automated Progress Line (`.flow-bar`):**
  * ScaleX from `0` to `1` across 6.5s linear animation.
  * Automatically switches to next tab when animation ends.
  * Pauses on mouse hover or keyboard focus (`.is-held`).
* **Tab Panels:** Each panel displays model architecture specs, sample confusion matrix accuracy (`97.8% mAP@50`), and defect visualization graphic.

---

### 3.6 Section 04: Resolution (`<section id="resolution" class="act">`)
*(Mapped from Aloud Section 04: "Ship it")*

#### Visual Narrative & Hierarchy
* **Step Eyebrow (`.step`):** `<span class="step-n">04</span>` + `Resolution`.
* **Headline (`.h2`):**
  ```html
  <h2 class="h2">Your road crews get the work order</h2>
  ```
* **Lede (`.lede`):**
  > Generate road inspection reports and prioritised maintenance recommendations. Dispatch repair plans directly into municipal GIS, work-order databases, or contractor mobile apps with exact coordinates, required asphalt volume, and photographic proof.
* **Feature Checklist (`.ticks`):**
  * *Checkmark 1:* **Direct Municipal Dispatch:** Sends prioritized work orders directly into Esri ArcGIS, Cityworks, or Cartegraph.
  * *Checkmark 2:* **Asphalt Tonnage Calculations:** Computes exact cubic meters and asphalt mix tonnage required per repair zone.
  * *Checkmark 3:* **Cryptographic Inspection Reports:** Export tamper-evident PDF and GeoJSON condition certificates.

#### Component 1: Interactive Municipal Dispatch Terminal (`#handoff` / `.term`)
* **macOS Terminal Window:** Dark slate background `#0d0d0d`, macOS window lights, title "RoadGuard Dispatch — route_101_corridor".
* **Interactive Button (`#term-enter`):** "Press Enter to dispatch" with `<kbd>⏎</kbd>`.
* **Simulated Typewriter Execution Script:**
  1. `> roadguard dispatch --corridor route-101 --priority critical`
  2. `⏺ Reading survey telemetry (survey_2026_11_13.geojson)`
  3. `⎿ Scanned 84.6 km · 14 critical potholes · 32 longitudinal cracks`
  4. `⏺ Computing asphalt patch requirements`
  5. `⎿ Segment MP 14.2: 420mm × 380mm × 72mm -> 0.11 tons hot-mix asphalt`
  6. `⎿ Segment MP 16.8: Alligator crack 4.2m -> 18 kg rubberized asphalt sealant`
  7. `⏺ Syncing to Municipal Cityworks API (endpoint: city.gov/gis/workorders)`
  8. `✻ Work Order #WO-8942 dispatched to Road Crew 4... (esc to cancel)` *(with animated unicode spinner `['✻', '✳', '✢', '·', '✢', '✳']`)*.

#### Component 2: Interactive Before/After Road Repair Slider (`.after` / `#compare`)
* **Subhead:** "Forty-eight hours later" / "The same road surface, after municipal crews executed the patch plan. Drag across to verify road restoration."
* **Comparison Split Container (`#compare`):**
  * Left image ("Before"): Severe deep pothole crater on deteriorated asphalt with cracked edges.
  * Right image ("After"): Smooth, freshly compacted hot-mix asphalt patch flush with road grade.
  * Interactive Drag Handle: 2px white line with 40px circular knob (`#f2f2f2`), hover zoom scale (`1.08`).
  * Quantic Ease Entry: Automatically sweeps from `86%` to `50%` position on scroll into view.
* **Repair Verification Card (`#tasks`):**
  * Header: "4 road defects resolved"
  * Task 1: "Severe pothole patched (MP 14.2)" [Done Checkmark]
  * Task 2: "Alligator crack sealed with mastic (MP 16.8)" [Done Checkmark]
  * Task 3: "Ravelled shoulder regraded (MP 18.1)" [Done Checkmark]
  * Task 4: "Pavement Condition Index restored to 94/100" [Done Checkmark]
  * Footnote: "Every completed repair logs photographic proof and contractor verification stamps back to city GIS."

---

### 3.7 Bento Grid / Core Platform Details (`<section id="details" class="details">`)
*(Mapped from Aloud Section: "And the rest, done properly")*

#### Visual Narrative & Hierarchy
* **Headline (`.h2`):** "And the infrastructure, built to standard"
* **Layout:** 6-tile grid (`repeat(3, minmax(0, 1fr))`) with 1px border grid matrix (`--line`).
* **Radial Mouse Spotlight (`setupTiles()`):**
  * Cursor movements update `--mx` and `--my` on hover, rendering dynamic radial gradient glow (`rgba(255, 255, 255, 0.055)`) beneath cursor.

#### 6 Technical Tiles:
1. **Edge Inference on Dashcams (`.tile`):**
   * *Icon:* Microchip / Edge SVG.
   * *Heading:* Edge-native inference
   * *Copy:* Runs on Jetson Orin, Ambarella, or standard smartphone chips. Full survey processing requires zero cellular bandwidth on the move.
2. **Sub-centimeter Depth Estimation (`.tile`):**
   * *Icon:* Ruler / LiDAR SVG.
   * *Heading:* 3D crater volumetric modeling
   * *Copy:* Calibrated stereo vision and monocular depth networks calculate pothole crater volume to forecast exact asphalt tonnage.
3. **ASTM D6433 Pavement Condition Index (`.tile`):**
   * *Icon:* Award / Certificate SVG.
   * *Heading:* Certified civil standards
   * *Copy:* Automated PCI calculation adheres strictly to ASTM D6433 defect density and deduct-value formulas for municipal compliance.
4. **Universal GIS & GeoJSON Export (`.tile`):**
   * *Icon:* Map / File SVG.
   * *Heading:* Open data interoperability
   * *Copy:* Export self-contained GeoJSON, Esri Shapefiles, or CSV bundles. Seamlessly connects to ArcGIS, QGIS, and municipal databases.
5. **Global Road Asset Search (`.tile`):**
   * *Icon:* Search SVG.
   * *Heading:* `<kbd>⌘</kbd><kbd>K</kbd> finds any street or defect`
   * *Copy:* Query street names, highway mile markers, defect IDs, or survey dates across your entire regional road inventory instantly.
6. **Zero-Loss Offline Caching (`.tile`):**
   * *Icon:* Hard Drive / Database SVG.
   * *Heading:* Tunnel and dead-zone resilient
   * *Copy:* Video frames and GNSS coordinates buffer directly to local NVMe storage; synchronizes automatically upon depot Wi-Fi return.

---

### 3.8 Privacy & Data Governance Section (`<section id="privacy" class="privacy">`)
*(Mapped from Aloud Section: "Your voice stays on your Mac")*

#### Visual Narrative & Hierarchy
* **Layout:** 2-column asymmetric grid (`5fr` to `7fr`, `gap: 56px`).
* **Left Column:**
  * Eyebrow: Lock icon SVG + "Data Governance".
  * Headline (`.h2`): "Road data stays sovereign. Driver privacy protected."
  * Lede: License plates and pedestrian faces are blurred directly at the camera edge before storage. Telemetry adheres strictly to municipal data sovereignty standards.
  * Link: "Read the infrastructure privacy framework ->".
* **Right Column (3 Key Metrics / Pillars - `.facts`):**
  * **Pillar 1:** `<dt>100% On-Edge</dt><dd>automatic license plate & face blurring</dd>`
  * **Pillar 2:** `<dt>Zero Cloud</dt><dd>raw citizen video is never uploaded or sold</dd>`
  * **Pillar 3:** `<dt>CJIS & GDPR</dt><dd>fully compliant infrastructure telemetry</dd>`

---

### 3.9 FAQ Accordion (`<section id="faq" class="faq">`)
*(Mapped from Aloud FAQ Section)*

#### Visual Structure
* **Layout:** 2-column asymmetric grid (`5fr` to `7fr`, `gap: 56px`).
* **Left Column:**
  * Headline: "Questions"
  * Subtitle: "Planning a municipal deployment? Contact civil@roadguard.ai."
* **Right Column:** 9 `<details class="faq-item">` accordions with smooth `::details-content` transition and rotating 45° cross icon.

#### 9 Detailed Q&As:
1. **What types of road damage does RoadGuard AI detect?**  
   RoadGuard AI detects potholes, alligator cracking, transverse and longitudinal cracks, rutting, surface raveling, edge cracking, and sunken utility manholes across asphalt and concrete pavements.
2. **Can RoadGuard AI run on standard vehicle dashcams and smartphones?**  
   Yes. The edge vision pipeline runs on commercially available dashcams (Garmin, Nextbase), iOS and Android smartphones, and ruggedized vehicle-mounted edge computers like NVIDIA Jetson.
3. **How accurate is the pothole depth and volume measurement?**  
   Using calibrated multi-frame stereo photogrammetry and temporal depth models, RoadGuard AI achieves sub-centimeter vertical accuracy ($\pm 5\text{mm}$), sufficient for calculating repair material volume.
4. **Does the system require continuous 5G or cellular connectivity?**  
   No. All inference, geocoding, and severity ranking occurs entirely on-device offline. Data synchronizes automatically when vehicle returns to depot Wi-Fi or when cellular coverage is restored.
5. **How does RoadGuard AI comply with privacy and surveillance regulations?**  
   All video frames pass through an on-edge hardware anonymization layer that detects and permanently blurs pedestrian faces and vehicle license plates before writing to disk.
6. **Which municipal asset management and GIS systems are supported?**  
   RoadGuard AI exports native layers to Esri ArcGIS, Cityworks, Cartegraph, Trimble Cityworks, IBM Maximo, and standard GeoJSON / Shapefile formats.
7. **How does the Pavement Condition Index (PCI) calculation work?**  
   RoadGuard AI implements ASTM D6433 standard methodologies, aggregating defect type, severity level (Low, Medium, High), and surface area density to compute normalized 0–100 PCI ratings per road segment.
8. **Can drone or aerial survey footage be imported?**  
   Yes. RoadGuard AI processes georeferenced orthomosaics and aerial video streams captured by commercial drones, automatically generating corridor-wide surface damage heatmaps.
9. **How is the AI model retrained and validated?**  
   Models are benchmarked against ground-truth laser profilometer datasets and municipal road authority inspections, with quarterly updates reflecting seasonal road wear patterns.

---

### 3.10 Bottom Call-to-Action (`<section id="download" class="cta">`)
*(Mapped from Aloud Bottom CTA)*

#### Visual Structure
* **Generative Road Surface Frequency Canvas (`#field`):**
  * Full-width background `<canvas id="field" class="field">` with radial mask.
  * Simulates 30 harmonic sine waves representing road surface accelerometer frequency / acoustic vibration profiles.
  * Rendered in 60 FPS Canvas 2D, pausing automatically off-screen.
* **Product Icon:** Glossy embossed RoadGuard AI radar shield icon (`104px x 104px` with deep drop shadow `0 24px 40px rgba(0,0,0,0.7)`).
* **Headline:** "Safer roads begin with a single scan." (`clamp(40px, 6.2vw, 72px)`).
* **Lede:** "Equip municipal fleet vehicles or explore our interactive detection playground."
* **Primary Button:** `.btn .btn-light .btn-lg` ("Explore Detection").
* **Telemetry Version Badge (`#dl-meta`):**
  `Engine v4.2.0 · Core Weights 84 MB · Certified ASTM D6433 · November 2026`

---

### 3.11 Video Demonstration Modal (`<dialog id="film" class="film-dialog">`)
*(Mapped from Aloud Video Modal)*

* **Trigger:** Clicked via "View Live Demo" in hero or navbar.
* **Dialog Element:** HTML5 `<dialog id="film">` with backdrop blur (`backdrop-filter: blur(12px)`).
* **Video Frame:** 16:9 aspect ratio (`max-width: 1280px`).
* **Content:** 80-second high-definition product demonstration:
  1. Dashcam mounting and initial camera calibration (0:00 - 0:15).
  2. Live vehicle run showing real-time 60 FPS bounding boxes over urban potholes (0:15 - 0:45).
  3. GIS map synchronization and cluster generation (0:45 - 1:05).
  4. Work order dispatch and road crew patch verification (1:05 - 1:20).
* **Interaction:** Auto-pauses on close; ESC key and backdrop click handlers; synced with URL hash (`#film`).

---

### 3.12 Global Footer (`<footer class="foot">`)
*(Mapped from Aloud Footer)*

* **Grid:** 4-column structured layout (`.foot-grid`):
  * **Column 1 (Brand):**
    * RoadGuard AI brand logo mark.
    * Tagline: *"Intelligent Road Monitoring. Safer Roads."*
    * Civic Infrastructure Innovation Badge.
  * **Column 2 (Platform):**
    * Live Detection Demo, Edge Vision Pipeline, GIS Mapping, ASTM D6433 Standard.
  * **Column 3 (Solutions):**
    * Municipal Public Works, State Departments of Transportation, Fleet Telematics, `civil@roadguard.ai`.
  * **Column 4 (Governance):**
    * Data Sovereignty, Privacy Framework, API Documentation, Security Compliance.
* **Bottom Bar:**
  * "© 2026 RoadGuard AI Infrastructure Systems. All rights reserved."
  * "Built for resilient transportation networks."

---

## 4. Asset Transformation & Replacement Plan

| Original Aloud Asset | RoadGuard AI Replacement Asset | Specifications & Format |
| :--- | :--- | :--- |
| `logo.png` | `roadguard-logo.png` | 22px height, sharp dark-mode vector typography + radar shield mark |
| `app-icon.png` | `roadguard-app-icon.png` | 104px x 104px glossy embossed dark-metallic radar shield icon |
| `hero-base-1203.webp` | `hero-dashcam-base-1203.webp` | 1203px x 900px forward-facing road survey dashboard UI |
| `hero-cards-1203.webp` | `hero-defect-cards-1203.webp` | Sprite sheet of detected defect cards (potholes, cracks, rutting) |
| `switchback-page-1200.webp` | `road-surface-survey-1200.webp` | Urban asphalt surface frame with real-world pavement damage |
| `wall-desert-800.webp` | `gis-map-satellite-800.webp` | Dark-mode GIS satellite / vector road network background texture |
| `dunes-1200.webp` | `road-mesh-glow-1200.webp` | Subtle retina road corridor topology mesh glow for hero background |
| `compare-before.webp` | `pothole-damaged-road.webp` | Before: Deep 70mm pothole crater with crumbling asphalt perimeter |
| `compare-after.webp` | `pothole-repaired-road.webp` | After: Freshly sealed, smooth, compacted hot-mix asphalt surface |
| SVG Symbols | RoadGuard Icon System | Radar, Target, Fracture, Ruler, GIS Map, Check, Terminal, Shield, Lock |

---

## 5. Interaction Engine Fidelity Checklist

- [x] **Scroll-Triggered Sticky Navigation Blur:** 5-layer stacked progressive backdrop blur active when `window.scrollY > 8`.
- [x] **Header Live Demo Expansion:** "View Live Demo" pill expands with `--ease` when hero section scrolls past view.
- [x] **Magnetic Spring Hover Physics:** Floating telemetry bar follows pointer smoothly with `0.16` spring damping factor within 220px radius.
- [x] **Dynamic Sensor Frequency Meter:** Live height-animating bars (`.bar-bars i`) driven by simulated sensor returns.
- [x] **Speech / Telemetry Karaoke Caption:** Click-to-play road defect survey readouts with synchronized word highlighting.
- [x] **SVG Markup Pen Loop:** Animated SVG path circle tracing road potholes with custom `stroke-dashoffset` curve.
- [x] **Telemetry Noise Strikethrough Diff:** Staggered delay strikethrough covering optical artifacts (`<s>`), with clean engineering specifications sliding up.
- [x] **Automated Model Taxonomy Tabs:** 5-tab tablist cycling automatically with 6.5s progress line (`flow-bar`), pausing on hover/focus.
- [x] **Interactive CLI Dispatch Simulator:** "Press Enter to dispatch" triggers sequential CLI typewriter log outputs with active unicode spinner (`✻`).
- [x] **Before/After Road Repair Slider:** Smooth pointer dragging, pointer capture, and automatic quartic ease entry from 86% to 50%.
- [x] **Bento Grid Spotlight Tracking:** Mouse position coordinates (`--mx`, `--my`) illuminate dynamic radial gradients across all 6 technical tiles.
- [x] **Generative Harmonic Canvas:** 30 harmonic sine wave lines rendered at 60 FPS in HTML5 Canvas 2D, responding to device pixel ratio.
- [x] **Native `<dialog>` Video Player:** Modal video dialog with backdrop blur, keyboard ESC handling, and URL hash syncing.
- [x] **Smooth Native `<details>` Accordion:** Zero-JS accordion transitions powered by `interpolate-size: allow-keywords;` and `::details-content`.

---

*This mapping serves as the design specification. All section names, layout ratios, tokens, and interactions are locked and ready for implementation.*


# Complete Reverse Engineering & UI Architecture Analysis: aloud.sh

> **Target Website:** [https://www.aloud.sh/](https://www.aloud.sh/)  
> **Target Project Adaptation:** RoadGuard AI — AI-Based Road Damage and Pothole Detection System  
> **Inspection Tooling:** Reverse Engineering MCP (`rea`), Chrome DevTools Protocol (CDP), Headless Chrome, AST & DOM Analysis  
> **Inspection Date:** November 13, 2026  

---

## 1. Executive Inspection & Telemetry Report

### 1.1 Successfully Inspected
1. **Live DOM & Accessibility Tree:** 1,477 total DOM nodes and 897 accessibility nodes captured via loopback CDP target `7A807897B87C6E5AC27C593F5865BC44`.
2. **Visual Viewport Screenshots:** Content-addressed PNG rendering of the hero viewport and component hierarchy.
3. **Core Stylesheet (`styles.css`):** 56 KB stylesheet containing all root variables, typography scales, fluid `clamp()` functions, custom container query units (`cqw`), pseudo-elements, multi-layer backdrop filters, and `@keyframes`.
4. **Core Application Script (`main.js`):** 28 KB (894 lines) of vanilla JavaScript containing 24 distinct interaction routines (magnetic springs, harmonic canvas waves, audio waveforms, interactive before/after image slider, interactive terminal emulator, and tabs).
5. **Asset Inventory:** Extracted raster webp graphics, logo PNGs, app icons, SVG icon symbols, and responsive webp assets.
6. **Responsive Layouts & Breakpoints:** Exact styling rules for 1080px, 900px, 720px, 420px, and `prefers-reduced-motion`.

### 1.2 Access Limitations & Exclusions
1. **External Policy Boundaries:** Outbound links to external third-party hosts (GitHub releases, Product Hunt, Wojciech Dobry personal portfolio) were not evaluated into subsequent browser pages to remain strictly within the target domain policy.
2. **Audio Binary Streams:** The MP4 film and individual `.m4a` voice note audio tracks (`/audio/note-y1.m4a`, etc.) were identified by URL, duration, transcript words, and envelope data, but binary audio files were not played through speaker outputs.

---

## 2. Global Architecture & Design Philosophy

The website `aloud.sh` is an example of modern **Dark-Mode Luxury / Craft Software UI**, evoking macOS native elegance (reminiscent of Linear, Apple, and Raycast).

### Key Architectural Characteristics
- **Zero Heavy Frameworks:** Pure semantic HTML5 + Vanilla CSS + Vanilla ES6 JS (No React, Next.js, Tailwind, or complex runtime overhead).
- **Container Queries First:** Extensive usage of `@container` and `cqw` units (`container-type: inline-size;`) allowing complex Mac UI frames and cards to scale fluidly without pixel distortion.
- **Physics-Based Spring Micro-Interactions:** Custom spring damping interpolation for floating elements (`x += (tx - x) * 0.16`).
- **Progressive Multi-Layered Blur:** 5-layer stacked pseudo-elements creating smooth non-linear backdrop blur gradients.
- **Native Browser Primitives with Modern CSS:** Employs `<dialog>` with `showModal()`, `<details>` with modern `::details-content` and `interpolate-size: allow-keywords;`, and CSS gradient text masking.

---

## 3. Section-by-Section Reverse Engineering

### 3.1 Fixed Global Navigation Bar (`<header id="nav" class="nav">`)
- **Structure:**
  - Outer fixed container (`height: 64px`, `top: 0`, `left: 0`, `right: 0`, `z-index: 50`).
  - `.nav-blur`: 5 nested `<i>` elements with progressive backdrop filters:
    - Layer 1: `blur(1px)`, mask `linear-gradient(180deg, #000 0%, #000 72%, transparent 100%)`
    - Layer 2: `blur(2.5px)`, mask `linear-gradient(180deg, #000 0%, #000 60%, transparent 90%)`
    - Layer 3: `blur(5px)`, mask `linear-gradient(180deg, #000 0%, #000 48%, transparent 78%)`
    - Layer 4: `blur(10px)`, mask `linear-gradient(180deg, #000 0%, #000 36%, transparent 64%)`
    - Layer 5: `saturate(1.4) blur(18px)`, mask `linear-gradient(180deg, #000 0%, #000 24%, transparent 50%)`
  - `.nav-inner`: Flex container (`max-width: 1248px`, `margin: 0 auto`, `padding: 0 24px`, `gap: 32px`).
- **Elements:**
  - **Logo:** `img/logo.png` (`height: 22px`, `width: auto`) wrapped in `<a class="logo" href="/">`.
  - **Nav Links:** `<nav class="nav-links">` with anchor pills for "How it works" (`#how`), "Privacy" (`#privacy`), "FAQ" (`#faq`). Font size `14px`, text color `--text-2` (`#8f8f8f`), hover background `rgba(255, 255, 255, 0.05)`, hover color `--text` (`#ededed`).
  - **Dynamic Video Watch Button (`.nav-watch`):** Starts with `max-width: 0`, `opacity: 0`, `overflow: hidden`. When user scrolls past the hero section (tracked via `IntersectionObserver`), `.nav` gets `.is-past`, triggering an animated expansion to `max-width: 180px` (`padding: 0 15px 0 13px`, `opacity: 1`) using `--ease`.
  - **Primary CTA:** `.btn .btn-light .btn-sm .dl-link` ("Download" with Apple logo SVG).
- **Interactions:**
  - Dynamic scroll listener adds `.is-scrolled` when `window.scrollY > 8` via `requestAnimationFrame`.

---

### 3.2 Hero Section (`<section id="top" class="hero">`)
- **Structure & Spacing:**
  - `padding-top: 176px`, `overflow: clip`, `position: relative`.
  - Background: `.hero-sky` dual radial glow + `.hero-glow` featuring retina desert dune landscape (`dunes-1200.webp` / `dunes-2400.webp`) positioned at `top: 36%` with `width: max(1800px, 150vw)`.
- **Typography & Copy:**
  - **Headline (`.hero-title`):** "Say it. Ship it."
    - Fluid size: `clamp(60px, 10.4vw, 124px)`, weight `400`, line-height `0.98`, tracking `-0.058em`.
    - Text gradient: `linear-gradient(180deg, #ffffff 34%, #9d9d9d 100%)` with `-webkit-background-clip: text`.
  - **Lede (`.hero-lede`):** "Point at anything you’re building — an app, a site, a design — and say what’s off..."
    - Width `max-width: 640px`, size `clamp(17px, 1.7vw, 20px)`, line-height `1.55`, color `--text-2` (`#8f8f8f`), `text-wrap: balance`.
- **Hero Actions & Badges:**
  - `.hero-actions`: Flex row with `gap: 12px`, `margin-top: 40px`.
    - Primary: White pill `.btn .btn-light .btn-lg` with Apple mark and "Download for Mac".
    - Secondary: Translucent dark `.btn .btn-ghost .btn-lg` with Play icon, "Watch the film", and duration badge "1:00".
  - `.hero-meta`: Monospace pill row: "Free" · "Apple silicon" · "macOS 12 or later" · "Version 1.6.1" (`font-size: 12.5px`, color `--text-3`).
- **Interactive Hero Stage (`.hero-stage`):**
  - Outer macOS window mockup (`.hero-window.window`) with `container-type: inline-size;`, `background: #111111`, and heavy drop shadow.
  - Image base: `hero-base-1203.webp`.
  - Overlaid animated cards: Individual note cards mapped via CSS sprite variables (`--x`, `--y`, `--w`, `--h`) and CSS custom property slot animation (`transform: translateX(calc(var(--slot, 0) * var(--step)))`).
  - Staging Preview Window (`.sb-window`): Displays the application being tested (`switchback-page-1200.webp`).
  - Floating Capture Bar (`.bar.bar-hero`):
    - White floating pill (`background: #ffffff`, text `#1a1a1a`, border `rgba(0, 0, 0, 0.08)`).
    - Features spring magnetic tracking (`setupMagnets()` moving element towards pointer within 220px reach radius).
    - Microphone icon with radar ping animation (`mic-ping`).
    - Audio waveform bars (`.bar-bars i`) driven by audio envelope interpolation (`meterBars`).
    - Real-time speech caption bubble (`.bar-caption`) highlighting words in synchrony with speech timestamps (`is-said`).

---

### 3.3 Section 01: Say it (`<section id="how" class="act">`)
- **Structure:**
  - Vertical padding: `176px 0 0`. Max content width: `1200px`.
  - Eyebrow (`.step`): Monospace box `.step-n` ("01") + text ("Say it").
  - Title (`.h2`): "Aloud knows what you mean by “this”" (gradient text mask, `clamp(36px, 5.4vw, 60px)`).
  - Lede (`.lede`): "Talk naturally. When you point at an element, circle a button or crop an area, Aloud connects what you said to the right screenshot..."
- **Feature Showcase:**
  - Large interactive application mockup showcasing live markup annotations:
    - `mk-loop`: SVG freehand stroke with `stroke-dasharray` / `stroke-dashoffset` animation simulating a live pen circle around a button.
    - `mk-label`: Floating pill badge ("Book a guide" label with icon).
    - `mk-area`: Scaled crop selection box with corner handles and dimensions badge (`11px` mono).
- **Sub-feature Grid (`.grid-3`):**
  - 3-column CSS Grid (`gap: 20px`), collapses to 1 column at $\le 900\text{px}$.
  - Card 1: "Drag out the detail" — Crop, box, arrow and freehand on the fly.
  - Card 2: "Talk, type, or both" — Dictate, type notes, or pause and edit.
  - Card 3: "Always one shortcut away" — Keyboard shortcut badges `<kbd>⌥</kbd><kbd>⇧</kbd><kbd>N</kbd>` and `<kbd>⌥</kbd><kbd>⇧</kbd><kbd>S</kbd>`.

---

### 3.4 Section 02: Sort it (`<section id="sort" class="act">`)
- **Structure & Theme:**
  - Eyebrow: `.step-n` ("02") + "Sort it".
  - Headline: "Everything you capture lands in one place".
  - Lede: "Each session is an open note. Notes live on your desk — drag to group them, click to listen back, or merge two into one."
- **Visual Presentation (`#desk`):**
  - Split grid (`.split`): `1.38fr` to `1fr`.
  - Desktop workspace background texture with desert wallpaper (`wall-desert-800.webp`).
  - Interactive stacked cards showcasing spatial grouping, drag physics, and note merging.
  - Secondary floating capture bar (`.bar-desk`) with running audio clock and real-time audio meter animation.

---

### 3.5 Section 03: Shape it (`<section id="shape" class="act">`)
- **Structure:**
  - Eyebrow: `.step-n` ("03") + "Shape it".
  - Headline: "“Wait, no, scrap that.” Got it."
  - Lede: "Spoken feedback is full of restarts, filler and second thoughts. Aloud strips the noise, keeps the intent, and turns your monologue into clean, actionable notes."
- **Component 1: Speech Diff Inspector (`#diff`):**
  - Layout: 3-column grid (`1fr auto 1fr`), middle column contains directional transition arrow `->`.
  - Left Card ("As you said it" · 8 lines · Whisper on-device):
    - Raw transcript text with animated strikethrough lines (`<s>`) covering fillers and hesitation phrases (`"Okay so, um,"`, `"like gonna the, the,"`, `"Thanks for watching!"`).
    - Strikethrough effect uses animated CSS background line sizing (`background-size: 100% 1px`).
    - Repaired words styled with dotted underline `<u>` (`text-decoration: underline dotted rgba(255, 255, 255, 0.65)`).
  - Right Card ("As you meant it" · 6 lines · the call you stood by):
    - Cleaned, structured bulleted specification.
  - Diff Legend: Visual explanatory legend under the cards defining struck-through and dotted underline styles.
- **Component 2: Workflows Tablist (`#flows`):**
  - Subhead: "Four workflows, and the ones you write" / "Each runs on its own, on the model you pick..."
  - Tablist (`role="tablist"`): 5 pill tabs:
    1. Clean up (Broom icon)
    2. Clarify (Question mark icon)
    3. Add images (Camera/Image icon)
    4. Plan (List checkmarks icon)
    5. Your own (Plus icon)
  - Auto-play Progress Bar: Active tab contains a bottom line (`.flow-bar`) that expands from `scaleX(0)` to `scaleX(1)` over 6.5s. When the animation completes, the next tab activates automatically. Pauses on user hover, pointer enter, or keyboard focus (`is-held`).
  - Full keyboard accessibility: Left/Right/Up/Down arrows cycle tabs, Home/End jump to ends.

---

### 3.6 Section 04: Ship it (`<section id="ship" class="act">`)
- **Structure:**
  - Eyebrow: `.step-n` ("04") + "Ship it".
  - Headline: "Your agent gets the plan".
  - Lede: "Hand your notes straight to Claude Code, Cursor or Codex. The plan arrives with each task tied to the exact screenshots that explain it."
  - Feature checklist (`.ticks`): 3 bullet items with checkmark icons.
- **Component 1: Interactive Terminal Emulator (`#handoff`):**
  - Side-by-side split grid (`minmax(0, 1fr) minmax(0, 1fr)` with 72px gap).
  - Terminal window (`.term`) styled like macOS terminal (dark background `#0d0d0d`, macOS window lights, title "Claude Code — aloud").
  - Claude terracotta banner (`border: 1px solid var(--claude)`).
  - Interactive Action Pill (`#term-enter`): "Press Enter to run it" with `<kbd>⏎</kbd>`.
  - Click Interaction: Triggers simulated CLI execution:
    - Clears input prompt.
    - Sequentially appends typewriter log items: reading plan (`plan.md`), expanding 4 subtasks.
    - Displays active animated Claude spinner glyph (`✻` cycling through `['✻', '✳', '✢', '·', '✢', '✳']` every 180ms).
- **Component 2: Interactive Before/After Comparison Slider (`.after` / `#compare`):**
  - Header: "Twenty minutes later" / "The same page, after Claude Code worked through the plan. Drag across it to compare."
  - 2-Column Grid (`2fr 1fr`):
    - Left: Interactive split-view image container (`#compare`).
      - Base image ("Before"): Staging application before fixes.
      - Top image ("After"): Modified application with fixes, clipped using `clip-path: inset(0 0 0 var(--pos))`.
      - Divider handle: 2px bright line with circular draggable knob (`40px` diameter, `#f2f2f2` background) that scales up on hover/drag.
      - Full interaction support: Mouse pointer drag, touch `pan-y`, pointer capture, and hidden `<input type="range">` fallback for accessibility.
      - Entry Animation: Automatically animates from `86%` to `50%` position using quartic ease-out (`1 - Math.pow(1 - t, 4)`) when scrolled into view.
    - Right: Tasks Completion Card (`#tasks`):
      - Lists the 4 tasks with step numbering badges and animated green checkmarks that pop in sequentially with spring timing (`var(--d)`).

---

### 3.7 Bento Grid / Feature Section (`<section id="details" class="details">`)
- **Heading:** "And the rest, done properly" (`max-width: 760px`, `margin-bottom: 56px`).
- **Layout & Structure:**
  - 6-tile grid (`.tiles`): `grid-template-columns: repeat(3, minmax(0, 1fr));`.
  - Border matrix: Top and left bordered by `--line`; each `.tile` has right and bottom `--line` (clean 1px grid divider structure).
- **Interactive Radial Mouse Spotlight (`setupTiles()`):**
  - Each tile has a `::before` pseudo-element with:
    `background: radial-gradient(360px circle at var(--mx, 50%) var(--my, 50%), rgba(255, 255, 255, 0.055), transparent 60%)`.
  - JavaScript tracks pointer move and updates `--mx` and `--my` coordinates relative to each tile's bounding box.
- **Tile Contents:**
  1. *Transcribed on your Mac* — Whisper runs on-device. Audio/screen recordings never leave.
  2. *Point at it harder* — Crop, arrow, box, freehand, highlight and text on screenshots.
  3. *Nothing a model does is final* — Full revision history, one-click restore.
  4. *One file for anyone* — Self-contained HTML export with zero runtime dependencies.
  5. *<kbd>⌘</kbd><kbd>K</kbd> finds anything* — Global search across all notes and transcript words.
  6. *Built not to lose a word* — Crash-resilient periodic disk write buffer.

---

### 3.8 Privacy Section (`<section id="privacy" class="privacy">`)
- **Layout:** 2-column asymmetric grid (`5fr` to `7fr`, `gap: 56px`).
- **Left Column:**
  - Eyebrow: Lock icon SVG + "Privacy".
  - Headline (`.h2`): "Your voice stays on your Mac".
  - Lede: Details on on-device processing and 90-day retention policy for optional inference steps.
  - Link: "Read the privacy policy ->".
- **Right Column (3 Key Metrics / Pillars - `.facts`):**
  - Definition list `<dl class="facts">`:
    - Pillar 1: `<dt>On-device</dt><dd>transcription, with Whisper</dd>`
    - Pillar 2: `<dt>90 days</dt><dd>then workflow data is deleted</dd>`
    - Pillar 3: `<dt>Never</dt><dd>used to train models</dd>`
  - Numbers styled with large semi-bold typography (`clamp(24px, 2.6vw, 32px)`).

---

### 3.9 FAQ Section (`<section id="faq" class="faq">`)
- **Layout:** 2-column asymmetric grid (`5fr` to `7fr`, `gap: 56px`).
- **Left Column:**
  - Headline: "Questions".
  - Subhead: "Anything else? Write to hello@aloud.sh."
- **Right Column (Accordion List):**
  - 9 `<details class="faq-item">` disclosure elements.
  - `<summary>` contains question title and an SVG plus icon (`i-plus`).
  - **Modern Smooth CSS Transition:**
    - Uses CSS `interpolate-size: allow-keywords;` on `:root`.
    - Accordion content transitions via:
      ```css
      .faq-item::details-content {
        block-size: 0;
        overflow: clip;
        transition: block-size 0.45s var(--ease), content-visibility 0.45s allow-discrete;
      }
      .faq-item[open]::details-content {
        block-size: auto;
      }
      ```
    - Plus icon rotates 45 degrees (`transform: rotate(45deg)`) to form a close "×" icon when open.

---

### 3.10 Bottom Call-to-Action (`<section id="download" class="cta">`)
- **Structure & Spacing:**
  - `margin-top: 176px`, `padding: 176px 0 184px`, centered column layout.
  - Border top: 1px solid `--line`.
- **Generative Harmonic Wave Canvas (`#field`):**
  - Full-width background `<canvas id="field" class="field">` with radial mask.
  - Driven by `setupField()`:
    - 30 harmonic sine wave lines with 6 partial frequencies.
    - Smooth wave simulation rendered via Canvas 2D context using `requestAnimationFrame`.
    - Automatically pauses when out of view via `IntersectionObserver`.
    - Adapts to device pixel ratio (`devicePixelRatio`) via `ResizeObserver`.
- **Foreground Content:**
  - App Icon: 104px x 104px embossed macOS app icon with drop shadow `0 24px 40px rgba(0, 0, 0, 0.7)`.
  - Title: "Next time, just say it" (`clamp(40px, 6.2vw, 72px)`).
  - Lede: "Free for Apple silicon Macs running macOS 12 or later."
  - Button: Large white pill `.btn .btn-light .btn-lg` ("Download for Mac").
  - Dynamic Release Metadata (`#dl-meta`): "Version 1.6.1 · 148 MB · November 7, 2026" (populated asynchronously via `/api/release`).

---

### 3.11 Video Modal Dialog (`<dialog id="film" class="film-dialog">`)
- **Structure:**
  - Native HTML5 `<dialog>` element styled with backdrop blur (`backdrop-filter: blur(12px)`).
  - Uses native JavaScript `.showModal()` and `.close()` APIs.
  - Video Frame: Fixed aspect ratio `16 / 9`, `width: min(1280px, 100%, calc((100dvh - 120px) * 16 / 9))`, radius `16px`.
  - Video element: Source `video/aloud-film.mp4`, poster `video/aloud-film-poster-1920.webp`, subtitles `video/aloud-film.vtt`.
  - Close button: Floating circular button in top right (`44px` diameter, backdrop blur).
  - Behavior: Closes on backdrop click, Escape key, or close button; auto-pauses playback on close; updates browser URL hash (`#film`).

---

### 3.12 Footer (`<footer class="foot">`)
- **Structure:**
  - `padding: 72px 0 40px`, border top 1px solid `--line`.
  - 4-column grid (`.foot-grid`): `minmax(0, 2fr) repeat(3, minmax(0, 1fr))`.
- **Column 1 (Brand):**
  - Brand logo (`logo.png`, 22px height).
  - Mission quote: "Feedback you say, for the agents you build with."
  - Product Hunt featured badge.
- **Column 2 (Aloud):** Links to The film, How it works, FAQ, Download for Mac.
- **Column 3 (Studio):** Links to Brain function collapse, Wojciech Dobry, `hello@aloud.sh`.
- **Column 4 (More):** Links to Releases on GitHub, Product Hunt, Privacy Policy, Terms and Conditions.
- **Bottom Bar:** Flex row with copyright "© 2026 Brain function collapse" and "Made for the Mac".

---

## 4. Interaction Engine & State Matrix

| Feature | Trigger | Implementation Mechanism | Behavioral Outcome |
| :--- | :--- | :--- | :--- |
| **Scroll Header Blur** | Scroll position > 8px | `requestAnimationFrame` + `.classList.toggle('is-scrolled')` | Fades in 5-stage progressive backdrop blur |
| **Watch Film Nav CTA** | Scrolling past Hero | `IntersectionObserver` on `.hero` + `.classList.toggle('is-past')` | Expands `.nav-watch` from 0px to 180px with swift ease |
| **Magnetic Mic Pill** | Pointer movement | Spring physics (`x += (tx - x) * 0.16`) within 220px radius | Follows mouse position smoothly and returns to center |
| **Voice Note Replay** | Click floating capture bar | HTML5 Audio play + `requestAnimationFrame` meter calculation | Live waveform animation, timer clock, word-by-word karaoke text |
| **Strikethrough Diff** | Intersection threshold 0.4 | Staggered delay loop (`--d`) on `<s>` and `<p>` elements | Strikethrough lines draw across filler words; clean text slides up |
| **Workflow Auto-Tabs** | 6.5s timer or manual click | `@keyframes flow-bar` + `animationend` listener | Tab progress line fills up, automatically switches to next tab |
| **Terminal Simulation** | Click "Press Enter to run it" | Staggered setTimeout sequence + DOM append + setInterval spinner | Simulates Claude Code prompt execution and subtask expansion |
| **Before/After Drag** | Pointerdown/move on slider | Pointer capture + `clip-path: inset(0 0 0 var(--pos))` | Splits before and after image dynamically with smooth ease |
| **Bento Tile Glow** | Pointer move over grid | CSS variables `--mx` and `--my` updated via mouse position | Illuminates radial gradient spotlight under cursor |
| **Harmonic Wavefield**| Continual canvas render | 30 sine-wave formula partials on HTML5 `<canvas>` | Creates undulating generative audio landscape in bottom CTA |

---

## 5. Architectural Blueprint for RoadGuard AI

To recreate this frontend for **RoadGuard AI (AI-Based Road Damage and Pothole Detection System)**, the exact component mappings will be:

1. **Navigation:** RoadGuard AI logo + Nav links (Detection Pipeline, Edge AI, Damage Taxonomy, FAQ) + "Launch Console" CTA.
2. **Hero Section:**
   - Headline: *"Scan it. Map it. Fix it."* (Using identical gradient text styling).
   - Subhead: Real-time high-speed dashcam & drone pothole detection, spatial severity mapping, and automated municipal work-order dispatch.
   - Dual CTAs: "Explore Live Detection" + "Watch Demo (1:00)".
   - Hero Mockup: RoadGuard AI Edge detection console running live bounding boxes over potholed road video feed.
3. **Section 01 (Scan it):** Real-time pothole and asphalt cracking identification with bounding box SVG animations (`mk-loop`, `mk-area`) over road surface feeds.
4. **Section 02 (Sort it):** Spatial cluster sorting — potholes categorized by severity index (P1 Critical to P4 Minor) and geo-tagged on GIS road network.
5. **Section 03 (Shape it):** Raw sensor data vs Cleaned telemetry diff (filtering false positives like puddle reflections and shadows). Tabbed AI models (YOLO-v11 Edge, Segmentation, Depth Estimation).
6. **Section 04 (Ship it):** Automated dispatch integration (Send to Road Maintenance API / Municipal GIS) + Interactive Before/After road repair comparison slider.
7. **Feature Bento Grid:** 6 spotlight cards (Edge Inference on Jetson/Mobile, Sub-centimeter Depth Estimation, Offline GIS Sync, Export GeoJSON/PDF, etc.).
8. **Edge Privacy & Security Section:** On-device camera processing; zero video upload; telemetry deletion guarantees.
9. **FAQ Accordion:** Full technical and municipal deployment questions.
10. **Bottom CTA:** Generative road network/frequency wavefield canvas + download/deploy action.

---

*This document serves as the ground-truth technical specification for subsequent frontend implementation turns.*


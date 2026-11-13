# Design Tokens — Aloud.sh (Extracted Design System)

Extracted directly via Chrome DevTools Protocol inspection and stylesheet reverse-engineering of [aloud.sh](https://www.aloud.sh/).

---

## 1. Color System

### 1.1 Canvas & Surface Colors
| Token Name | Value | Purpose / Usage |
| :--- | :--- | :--- |
| `--bg` | `#0a0a0a` | Main page background (deep near-black) |
| `--surface` | `#121212` | Dark card surface base |
| `--surface-2` | `#181818` | Elevated card surface, audio bar dock, tabs |
| `--white` | `#ffffff` | Pure white accent / contrast elements |
| Surface Subtle | `#111111` | Window background, note preview thumbnail face |
| Terminal Dark | `#0d0d0d` | Terminal body background |
| Terminal Title | `#1a1a1a` | Terminal titlebar background |
| Backdrop Dark | `rgba(6, 6, 6, 0.86)` | Video modal backdrop overlay |

### 1.2 Border & Line Colors
| Token Name | Value | Purpose / Usage |
| :--- | :--- | :--- |
| `--line` | `rgba(255, 255, 255, 0.075)` | Subtle component borders, grid dividers, section dividers |
| `--line-2` | `rgba(255, 255, 255, 0.12)` | Card outlines, interactive button borders, image frames |
| `--line-3` | `rgba(255, 255, 255, 0.20)` | Active tab borders, hover state outlines |
| Button Light Border | `rgba(0, 0, 0, 0.18)` | Subtle shadow/border on light buttons |
| Terminal Border | `#4a4a4a` | Terminal input prompt border |

### 1.3 Text & Foreground Hierarchy
| Token Name | Value | Hierarchy / Purpose |
| :--- | :--- | :--- |
| `--text` | `#ededed` | Primary body text, titles, headings, active states |
| `--text-2` | `#8f8f8f` | Secondary text, ledes, body paragraphs, descriptions, inactive nav |
| `--text-3` | `#7a7a7a` | Tertiary metadata, durations, release dates, keyboard key hints |
| `--text-4` | `#5a5a5a` | Quaternary text, dot separators, struck-through speech text |

### 1.4 Brand & Semantic Accent Colors
| Token Name | Value | Purpose / Usage |
| :--- | :--- | :--- |
| `--claude` | `#d97757` | Claude Code terracotta/orange accent (terminal spinner, active dots, borders) |
| Success / Active Dot | `#7fbf8c` | Green tool indicator dot in terminal output |
| Light Button BG | `#f2f2f2` | Primary download CTA button background (`#ffffff` on hover) |
| Light Button Text | `#0a0a0a` | Primary CTA button text |

---

## 2. Typography System

### 2.1 Font Families
| Token Name | Fallback Stack | Purpose |
| :--- | :--- | :--- |
| `--font` | `'Geist', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif` | Primary sans-serif for headings, body, navigation |
| `--mono` | `'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace` | Monospace numbers, timestamps, terminal code, diff metadata |
| `--keys` | `-apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'Segoe UI Symbol', sans-serif` | Keyboard badges (`<kbd>`), window titlebars, symbols |

### 2.2 Type Scale & Text Styles
| Style | Size | Weight | Line Height | Letter Spacing | Color / Gradient |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Title** | `clamp(60px, 10.4vw, 124px)` | 400 | `0.98` | `-0.058em` | `linear-gradient(180deg, #ffffff 34%, #9d9d9d 100%)` (text-clip) |
| **Hero Lede** | `clamp(17px, 1.7vw, 20px)` | 400 | `1.55` | `-0.01em` | `--text-2` (`#8f8f8f`) |
| **Section H2** | `clamp(36px, 5.4vw, 60px)` | 600 | `1.04` | `-0.045em` | `linear-gradient(180deg, #ffffff 30%, #a3a3a3 100%)` (text-clip) |
| **Subsection H3** | `clamp(26px, 3.2vw, 36px)` | 600 | `1.10` | `-0.035em` | `--text` (`#ededed`) |
| **Tile / Feature H4**| `17px` | 600 | `1.35` | `-0.015em` | `--text` (`#ededed`) |
| **Section Lede** | `clamp(17px, 1.5vw, 19px)` | 400 | `1.60` | `-0.005em` | `--text-2` (`#8f8f8f`) |
| **Eyebrow / Step** | `13px` / `15px` | 500 / 600 | `1.00` | `0.02em` / `-0.01em` | `--text-2` / `--text` |
| **Step Number Badge**| `12px` (Mono) | 400 | `22px` | `0.02em` | `--text-2` (`#8f8f8f`) |
| **Body / Card Text** | `15px` - `16px` | 400 | `1.55` - `1.65` | `normal` | `--text-2` (`#8f8f8f`) |
| **Terminal Code** | `12.5px` (Mono) | 400 | `1.60` | `normal` | `#e6e6e6` |
| **Button Text** | `14px` (sm) / `15px` / `16px` (lg)| 500 | `1.00` | `-0.01em` | Variable (`#0a0a0a` / `#ededed`) |
| **Metadata / Badges**| `11px` - `12.5px` (Mono)| 400 | `1.00` | `0.01em` - `0.02em` | `--text-3` (`#7a7a7a`) |

---

## 3. Spacing & Layout Grid

### 3.1 Dimensions & Layout Constraints
| Variable | Value | Purpose |
| :--- | :--- | :--- |
| `--wrap` | `1200px` | Maximum content width for inner containers |
| `--gutter` | `24px` (`16px` on mobile $\le$ 720px) | Horizontal page gutter padding |
| Max Container Width | `calc(var(--wrap) + var(--gutter) * 2)` = `1248px` | Outer boundary of `.wrap` and `.nav-inner` |
| Section Vertical Padding | `176px 0 0` (`112px` on mobile $\le$ 720px) | Top padding between homepage sections |
| Section Header Bottom Margin | `56px` - `64px` (`36px` - `40px` on mobile) | Spacing under section headline/lede block |
| Bottom CTA Section Padding | `176px 0 184px` (`120px 0 128px` on mobile) | Spacing for final download section |

### 3.2 Responsive Breakpoints
| Breakpoint | Trigger | Target Devices / Behavioral Adaptations |
| :--- | :--- | :--- |
| **Large Desktop** | `> 1080px` | Full multi-column grids, terminal desk side-by-side, comparison slider split |
| **Medium / Tablet** | `max-width: 1080px` | Tightened grid gaps (`ship` gap reduces from 72px to 48px), tile padding compresses |
| **Small Tablet / Phablet**| `max-width: 900px` | `.grid-3` collapses to single column (max 560px centered); `.split`, `.diff`, `.ship`, `.after-grid`, `.privacy-grid`, `.faq-grid` collapse to 1 column; `.tiles` reduces from 3 to 2 columns; footer switches to 3 columns |
| **Mobile** | `max-width: 720px` | `--gutter` reduces to 16px; `.nav-links` hidden; hero headline scales down; `.tiles` collapses to 1 column; feature bento stacks; hero window overflows with mask fade |
| **Compact Mobile** | `max-width: 420px` | `.hero-actions` stack vertically; buttons expand to 100% width; comparison tags reposition |
| **Motion Accessibility** | `prefers-reduced-motion: reduce` | All transitions and animations reset to `0.01ms !important`; smooth scroll disabled |

---

## 4. Elevation, Radii & Shadows

### 4.1 Border Radii
| Token / Component | Radius Value | Applied To |
| :--- | :--- | :--- |
| `--radius` | `16px` | Default card containers, screenshot frames, film dialog |
| Button Pill | `999px` | All buttons (`.btn`), nav links, tags, badges |
| Sub-cards & Terminals | `12px` - `14px` | Terminal window (`12px`), tasks card (`14px`), capture bar (`14px`) |
| Small Badges / Step N | `6px` - `8px` | Step indicator (`6px`), kbd badges (`0.34em` $\approx 5\text{px}$), terminal welcome (`8px`) |
| Hero Outer Window | `0.9975% / 1.3334%` | Aspect-ratio calibrated fluid desktop window frame |
| Staging App Window (`.sb-window`) | `12px` | Staging preview overlay window |

### 4.2 Shadows & Depth
| Token / Component | Shadow Specification |
| :--- | :--- |
| `--card-shadow` | `inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 1px 2px rgba(0, 0, 0, 0.5), 0 12px 32px rgba(0, 0, 0, 0.35)` |
| **Hero Window Shadow** | `0 0 0 1px rgba(255, 255, 255, 0.09), 0 1px 0 rgba(255, 255, 255, 0.06) inset, 0 40px 100px -20px rgba(0, 0, 0, 0.8), 0 80px 160px -40px rgba(0, 0, 0, 0.6)` |
| **Floating Capture Bar** | `inset 0 1px 0 rgba(255, 255, 255, 0.055), 0 1px 2px rgba(0, 0, 0, 0.55), 0 8px 24px rgba(0, 0, 0, 0.55), 0 30px 80px -10px rgba(0, 0, 0, 0.75)` |
| **Hero Capture Bar (White)**| `0 1px 2px rgba(0, 0, 0, 0.1), 0 4px 12px rgba(0, 0, 0, 0.16), 0 30px 80px -10px rgba(0, 0, 0, 0.75)` |
| **Terminal Window** | `0 0 0 0.5px rgba(0, 0, 0, 0.8), inset 0 0 0 1px rgba(255, 255, 255, 0.1), 0 30px 80px rgba(0, 0, 0, 0.55), 0 8px 24px rgba(0, 0, 0, 0.3)` |
| **Button Primary (Light)** | `inset 0 -1px 0 rgba(0, 0, 0, 0.18), 0 1px 2px rgba(0, 0, 0, 0.5), 0 8px 24px rgba(0, 0, 0, 0.25)` |
| **Button Secondary (Ghost)**| `inset 0 0 0 1px rgba(255, 255, 255, 0.12)` (expands to `rgba(255, 255, 255, 0.2)` on hover) |
| **Comparison Slider Knob** | `0 6px 20px rgba(0, 0, 0, 0.5)` |

---

## 5. Motion, Physics & Transitions

### 5.1 Timing Curves & Durations
| Token / Property | Timing Curve / Duration | Applied To |
| :--- | :--- | :--- |
| `--ease` | `cubic-bezier(0.16, 1, 0.3, 1)` | Standard Apple-style swift spring-out easing |
| Snappy Curve | `cubic-bezier(0.3, 0, 0.2, 1)` | Screenshot crop marker expand |
| Smooth Draw Curve | `cubic-bezier(0.45, 0, 0.25, 1)` | SVG circle pen draw animation |
| Button Transitions | `0.2s ease` / `scale 0.2s var(--ease)` | Hover and active scale down (`scale(0.98)`) |
| Auto-Tab Progress | `6.5s linear` | Workflow auto-timer progress line (`flow-bar`) |
| Scroll Reveal Transition | `0.6s ease` (with `0.09s` staggered sibling delay) | Elements with `[data-reveal]` entering viewport |
| Accordion Interpolation | `block-size 0.45s var(--ease)` | FAQ `<details>` open/collapse with `allow-discrete` |

### 5.2 Keyframe Animations
- `@keyframes bar-sweep`: 0.5s shine wipe across the floating capture bar during save action (`left: -45%` to `130%`).
- `@keyframes mic-ping`: 2.8s infinite radar ping radiating from the microphone icon (`scale: 1` to `1.45`, `opacity: 0.8` to `0`).
- `@keyframes bar-wait`: 1.8s infinite wave opacity pulse on waiting ellipses (`0.35` to `1.0`).
- `@keyframes bar-this`: 2.4s infinite shimmer gradient sweep across `"this"` keyword.
- `@keyframes film-in`: 0.5s modal frame entry with translateY(12px) and scale(0.975) to 1.
- `@keyframes caret-blink`: 1.0s steps(1) terminal prompt blinking cursor.
- `@keyframes flow-bar`: 6.5s linear scaleX(0) to scaleX(1) progress line across active tab.

---

## 6. Component Blueprints

### 6.1 Button Matrix
- **Primary (`.btn-light`)**: Background `#f2f2f2`, hover `#ffffff`, text `#0a0a0a`, radius `999px`, height `40px` (`48px` for `.btn-lg`, `32px` for `.btn-sm`).
- **Secondary (`.btn-ghost`)**: Background `rgba(255, 255, 255, 0.04)`, hover `rgba(255, 255, 255, 0.08)`, border `inset 0 0 0 1px var(--line-2)`.
- **Keyboard Shortcut Pill (`<kbd>`)**: Linear gradient `#262626` to `#1b1b1b`, inset highlights, font stack `--keys`, vertical-align `0.12em`.

### 6.2 Progressive Blur Backdrop
Navbar uses a 5-layer stacked pseudo-element backdrop filter with progressive linear masks:
1. `blur(1px)` with mask `linear-gradient(180deg, #000 0%, #000 72%, transparent 100%)`
2. `blur(2.5px)` with mask `linear-gradient(180deg, #000 0%, #000 60%, transparent 90%)`
3. `blur(5px)` with mask `linear-gradient(180deg, #000 0%, #000 48%, transparent 78%)`
4. `blur(10px)` with mask `linear-gradient(180deg, #000 0%, #000 36%, transparent 64%)`
5. `saturate(1.4) blur(18px)` with mask `linear-gradient(180deg, #000 0%, #000 24%, transparent 50%)`


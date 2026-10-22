# DESIGN.md: ScamKill Visual World, Behavioral UX & Motion System

## 1. Visual World: "Warm Daylight Paper & Vietnamese Jade Shield"
ScamKill rejects cold corporate SaaS templates and panic-inducing neon cybersecurity tropes. When an older adult receives a threatening call claiming to be the police or a crying child in an accident, the interface must lower their heart rate, eliminate screen glare, and make the safe action unmistakable.

### Color System (3 Senior-Accessible Modes)
1. **`warm_day` (Warm Daylight Paper, Default):**
   - Ground: Warm Rice Paper `#FAF6EE` (elevated surface `#FFFDF9`, subtle card border `#DFD6C3`), eliminating harsh `#FFFFFF` glare for cataract and presbyopic eyes.
   - Primary Authority (Jade Shield): `#0B5D56` (pressed `#084741`, soft tint `#E3F2EF`).
   - High-Risk Vermilion: `#B91C1C` (tint `#FEF2F2`, border `#F8B4B4`).
   - Caution Amber: `#B45309` (tint `#FFFBEB`, border `#FCD34D`).
   - Epistemic Unverified Slate: `#334155` (tint `#F1F5F9`, border `#CBD5E1`).
   - Primary Ink: `#18181B`, Secondary Ink: `#3F3F46` (tinted warm charcoal, contrast ratio >= 7.5:1).
2. **`calm_night` (Calm Night Slate):**
   - Ground: Deep Warm Slate `#111615` (surface `#1A2220`, border `#2C3A37`), Jade Accent `#2DD4BF`, Primary Ink `#F5F2EB`.
3. **`high_contrast_senior` (Gold-on-Obsidian for Low Vision):**
   - Ground: Pure Obsidian `#090A0B` (surface `#121417`, 2px solid border `#FACC15`), Primary Action `#FACC15` (ink `#090A0B`), High-Risk `#FF4D4D`, Primary Ink `#FFFFFF`.

## 2. Artisanal Non-Generic Typography & Live Senior Font Scaler
- **Display & Editorial Headings:** `Bricolage Grotesque` (600/700/800), an expressive humanist display grotesque with full Vietnamese diacritic support and warm, unmistakable character.
- **Body & Low-Vision Reading:** `Atkinson Hyperlegible` (400/700), engineered by the Braille Institute specifically for low-vision readers so characters like `1`, `l`, `I` and `0`, `O` are immediately distinguishable.
- **Phone Numbers, Safe-Words & Timers:** `Azeret Mono` (`font-variant-numeric: tabular-nums`) so caller ID digits (`0918 765 432`) and countdowns (`00:59`) never jitter.
- **Live Header Font-Size Scaler (`useSeniorFontScale`):**
  - `Standard (1.0x: 17-18px base)`
  - `Large (1.15x: 20-21px base)`
  - `Extra Large (1.30x: 23-24px base)`
  Controllable in 1 tap from the top header on every screen.

## 3. Motion Thesis: GSAP + React Motion ("Calm Heartbeat, Breathing Pause & Spotlight Guide")
- **Focal Moment 1 (The 60-Second Breathing Shield in `CoolingOffModal`):** Expanding and contracting concentric Jade/Amber halo on a 4-second inhale / 4-second exhale physiological cadence (`gsap` / `Animated.loop`), pacing the user's breathing (*"Inhale slowly for 4 seconds... Do not open your banking app yet"*) while locking impulsive action.
- **Focal Moment 2 (Incoming Call Acoustic Ripple in `IncomingCallModal`):** Concentric radar rings around the caller badge paired with `expo-haptics` double-pulse vibration.
- **Focal Moment 3 (Interactive Annotated Guidebook with SVG Arrows, Circles & Zoom Lens):** GSAP-animated SVG directional arrows, pulsing numbered callout circles (`1..5`), and a layered `1.0x / 1.5x / 2.0x` zoom/pan canvas.
- **Reduced Motion Contract:** Respects `prefers-reduced-motion: reduce` by replacing spatial scale pulses with calm opacity and color state transitions.

## 4. Humanizer & Anti-AI-Slop Rules
- **Zero Em-Dashes:** Never use em-dashes in UI copy, locales, or product prose. Use clear periods, colons, or parentheses.
- **Zero Bureaucratic Jargon:** Write like a caring family member speaking to a parent or grandparent.

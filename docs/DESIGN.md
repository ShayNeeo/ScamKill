# DESIGN.md — ScamKill Visual World & Design System

## 1. Visual World: "Ấm Áp Gia Đình / Warm Daylight Paper & Jade Shield"
ScamKill rejects both clinical cold SaaS dashboards and panic-inducing neon cybersecurity tropes. When an older adult receives a threatening call claiming to be the police or a crying child in an accident, the interface must lower their heart rate, eliminate screen glare, and make the safe action unmistakable.

### Color System (3 Senior-Accessible Modes)
1. **`warm_day` (Sáng ấm áp — Default):**
   - Ground: Warm Rice Paper `#FAF6EE` (elevated surface `#FFFDF9`, subtle card border `#E5DEC9`) — eliminates harsh `#FFFFFF` glare for cataract and presbyopic eyes.
   - Primary Authority (Jade Shield): `#0B5D56` (pressed `#084741`, soft tint `#E3F2EF`).
   - High-Risk Vermilion: `#B91C1C` (tint `#FDF2F2`, border `#F8B4B4`).
   - Caution Amber: `#B45309` (tint `#FFFBEB`, border `#FCD34D`).
   - Epistemic Unverified Slate: `#334155` (tint `#F1F5F9`, border `#CBD5E1`).
   - Primary Ink: `#18181B`, Secondary Ink: `#3F3F46` (tinted warm charcoal, never washed-out gray; contrast ratio $\ge 7.2:1$).
2. **`calm_night` (Tối dịu mắt):**
   - Ground: Deep Warm Slate `#111615` (surface `#1A2220`, border `#2C3A37`), Jade Accent `#2DD4BF`, Primary Ink `#F5F2EB`.
3. **`high_contrast_senior` (Tương phản cao Vàng–Đen cho mắt lão thị):**
   - Ground: Pure Obsidian `#090A0B` (surface `#121417`, 2px solid border `#FACC15`), Primary Action `#FACC15` (ink `#090A0B`), High-Risk `#FF4D4D`, Primary Ink `#FFFFFF`.

## 2. Typography & Live Senior Font Scaler
- **Display & Headings:** `Be Vietnam Pro` (700/800) — crafted specifically for Vietnamese diacritics (`ấ, ệ, ử, ỗ`) so stacked marks never collide at tight line-heights.
- **Body & Instructions:** `Lexend` (400/500/600) — empirically designed to reduce visual crowding and improve reading speed for low-vision and older readers.
- **Phone Numbers, Safe-Words & Timers:** `JetBrains Mono` / tabular numerals (`font-variant-numeric: tabular-nums`) so digits in caller IDs (`0918 765 432`) and countdowns (`00:59`) never jitter.
- **Live Header Font-Size Scaler (`useSeniorPreferences`):**
  - `Чуẩn (1.0x — 18px base)`
  - `Chữ To (1.18x — 21px base)`
  - `Rất To (1.35x — 24px base)`
  Persisted in `AsyncStorage` / `localStorage` and controllable in 1 tap from the top header on every screen.

## 3. Motion Thesis: "Calm Heartbeat, Breathing Pause & Tactile Physics"
- **Focal Moment 1 — The 60-Second Breathing Shield (`CoolingOffModal`):** Expanding and contracting concentric Jade/Amber halo on a 4-second inhale / 4-second exhale cycle (`cubic-bezier(0.37, 0, 0.63, 1)`), physically pacing the senior's breathing (*"Hít vào thật sâu... Khoan mở ứng dụng ngân hàng"*) while locking impulsive action.
- **Focal Moment 2 — Incoming Call Acoustic Ripple (`IncomingCallModal`):** Gentle concentric radar rings around the caller badge so the user immediately distinguishes a live incoming call simulation from static cards.
- **Tactile Button Physics:** Every primary action button ($\ge 58\text{px}$ height) responds with immediate press compression (`scale(0.97)`, `120ms` ease-out) and high-contrast border definition.
- **Reduced Motion Contract:** Respects `prefers-reduced-motion: reduce` and in-app reduced-motion preferences by replacing spatial scale pulses with calm opacity/color state transitions.

## 4. Humanizer & Anti-AI-Slop Rules
- **Zero Bureaucratic or AI-Translated Jargon:** Never say *"Hệ thống thực hiện quy trình phân tích đa tác tử"* or *"Khởi tạo giao thức xác thực"* to a 70-year-old. Say: *"Bác khoan chuyển tiền nhé. Hãy hỏi mật khẩu gia đình trước."*
- **Concrete Vietnamese Family Roles:** Address the user respectfully as *Bác / Cô / Chú* or *Mẹ / Bố*, and name relatives concretely (*Con gái Chị Hương*, *Con trai Anh Minh*).
- **Refuse Category Slop:** No fake glowing cyberpunk grids, no meaningless percentage gauges ("98.4% AI Confidence"), no generic English startup buzzwords in Vietnamese UI, and no leftover references to unrelated hackathons.

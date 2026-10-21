# PRODUCT.md — ScamKill (QuadDraKe)

## Product Truth
- **Name:** ScamKill (*Lá chắn AI giúp người cao tuổi và gia đình cùng chống lừa đảo qua điện thoại*)
- **Team / Organization:** QuadDraKe (Lê Quỳnh Thư, Phạm Quốc Thanh, Nguyễn Khoa Quang Minh, cộng sự — HITC InnoStar 2026)
- **Vision:** *Không ai phải đối mặt với lừa đảo một mình.* (No one has to face a phone scam alone.)
- **Core Mechanism:** A 4-Step Family Protection Loop (**Phát hiện => Làm chậm => Xác minh => Cùng quyết định**) spanning the 3 chronological stages of a phone scam:
  1. **Before picking up a call (Layer 1 — Call Shield):** Matches caller numbers against ScamKill community reports, public advisories (nTrust/Bộ Công an), and behavioral heuristics (foreign prefixes, burst calls, not in contacts). Honest epistemic boundary: displays `"Chưa xác minh"` when data is insufficient rather than guessing.
  2. **While reading a message (Layer 2 — Message Analyzer):** Flags impersonation, artificial urgency (*"trong 24 giờ"*), OTP/money demands, malicious links, and APK lures with 1–3 plain-Vietnamese reasons, 0.85x voice readback, and one clear instruction (*"Đừng bấm liên kết. Hỏi người thân trước"*).
  3. **At the moment of decision (Layer 3 — Family Verification & Multi-Bot SOS):**
     - **Voice-Clone Relative Protocol:** Prompts the senior to (i) ask the pre-agreed **Family Safe-Word (`Mã gia đình`)** and (ii) **hang up and call back** the saved number in their contacts, paired with a 60-second breathing pause & 48-hour high-risk cooling-off lock.
     - **Consent-Gated Multi-Bot Alert:** 1-tap `"Tôi nghi ngờ"` dispatches alerts via **SMS, Zalo, and Telegram**. Default notifications send only Alert Type, Timestamp, and Phone Number; message/call content is shared only when the senior explicitly consents (PDPD 2025 compliant).

## Audience & Physical Scene
- **Primary Operators:** Vietnamese older adults (55–80+) reading on mid-range Android phones or iPhones under indoor daylight or evening room lamps, often experiencing presbyopia/cataract glare sensitivity and acute psychological pressure during a scam call.
- **Co-Operators:** Adult children and grandchildren (22–45) who configure the Family Safe-Word, install the PWA onto their parents' homescreen, and receive real-time SMS/Zalo/Telegram intervention alerts.

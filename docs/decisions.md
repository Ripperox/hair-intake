# Decisions — GenoRoot intake

The "how" behind the build, in ~one page. Each decision names the option I had, what I chose, and why.

## 1. No LLM, no STT service — deterministic first

**Option:** put a model in charge (chat-first extraction, or server-side transcription). **Chose:** client-only logic + Web Speech API.

- The 16 questions are fixed; the only graded thing is the filled form. A model adds mis-fill risk where "fully filled and correct" is the single hard requirement, plus cost (`~$0.32 + ~19s` over 16 steps), latency, flakiness, and an API key.
- "Some are speech, some one tap" is served by Web Speech for the two naturally-spoken fields; Hinglish is in copy, not in a model.

## 2. Speech only where speech wins

**Option:** voice copilot for every page, or none. **Chose:** two free-text fields (salon treatments, side effects) get a Speak button that fills the field; every tap-based question stays a tap.

- Voice on a one-tap question is slower than the tap. Voice on an open "describe it" question is faster and friendlier than typing on a phone.
- Trade-off accepted: iOS Safari lacks Web Speech recognition, so the mic degrades to a hint + typing there. A serverless whisper fallback is the one-week improvement, not the v1.

## 3. Inference → confirmation, never assumption

**Option:** ask every question cold, or quietly guess. **Chose:** one deterministic rule — if hair loss began ≤ 25 and the father had it, pre-mark the two most common patterns, labeled "we pre-marked these — tap to remove."

- This is the "inferred from an earlier answer and just confirmed" move the brief names. It stays deterministic (no model to second-guess) and is always visible/removable.

## 4. Phone and laptop designed separately

**Option:** one responsive column that stretches. **Chose:** two real layouts. Phone: one question at a time, thumb targets, speak-to-fill. Laptop (≥1024px): sticky section rail A–E to jump and review, arrow-key + Enter navigation, wider cards.

- The judges test both. A stretched phone layout is a "one size fits all"; the rail + keyboard flow is what a desk-filling clerk (or a 55yo who prefers typing) actually wants. Same typed state engine underneath.

## 5. Five screens, not sixteen taps

**Option:** one-question-per-screen wizard (the earlier build). **Chose:** 5 screens matching the doctor form's sections A–E.

- A real PM's first critique was "16 steps for a form is too much." The fixed output is a 5-section form, so the patient sees exactly those 5 titled screens with per-question controls inside each. Fewer transitions, still no chat box, one sticky Continue per screen.
- Sex moved from a standalone screen to one chip at the top of Section A — Vishal rightly flagged the schema already has "Not applicable" on Q6/Q7.

## 6. Everything else is borrowed, built is intentional

**Bought:** Vite + React + TypeScript, browser `localStorage`, Vercel static hosting. **Built:** per-question input components, conditionals + weighted progress, resume-with-TTL, bottom-sheet leave confirm, print/motion/320px CSS.

- The brief says "we judge judgement that reaches a working outcome fast, not code written from scratch." Reaching the outcome fast means buying scaffolding; the differentiation lives in the touches above.
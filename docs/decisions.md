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

## 3. Inference only where the answer is already given

**Option:** infer likely answers from earlier ones, or ask everything cold. **Chose:** map every relationship between the 16 questions first (`docs/inference-map.md`), then build only the ones that are entailments rather than correlations.

- **Built:** Q12's "side effects = yes" *is* the answer to Q14 — the same sentence, already given — so Q14 arrives answered, naming the product it came from. Both one-tap skips together mean there was no past treatment, so Q14 is No. And a man is never shown PCOS in Q5.
- **Cut:** Q4 used to pre-mark the two likeliest patterns from onset age + father's history. It demoed well and it went — pattern is the doctor's diagnostic signal, and a pre-marked chip the patient skims past becomes an answer nobody gave. Same reason the other nine correlations in the map stayed rejected: irregular cycles are a *symptom*, and Q5 asks what a doctor *diagnosed*.
- The rule that separates them: **infer what the patient has already told you; never infer what the doctor is there to read.** Every derived answer states its source and is one tap to overrule.

## 4. Phone and laptop designed separately

**Option:** one responsive column that stretches. **Chose:** two real layouts. Phone: one section at a time, thumb targets, speak-to-fill. Laptop (≥1024px): the **desk console** — completion rail (A–E + Review) left, the whole form as one scrollable document center, live "the form, filling itself" side panel right.

- The judges test both. A stretched phone layout is "one size fits all"; the desktop is a real form-filling surface, tiered by monitor width (2-col small laptops, 3-col ≥1170px, centered ≥1460px, bigger type ≥1800px). Same typed state engine underneath.
- Arrows move between sections; ⌘/Ctrl-Enter goes straight to Review; every answered section gets a check in the rail and an "answered" highlight in the live panel.

## 5. Five screens, not sixteen taps

**Option:** one-question-per-screen wizard (the earlier build). **Chose:** 5 screens matching the doctor form's sections A–E.

- A real PM's first critique was "16 steps for a form is too much." The fixed output is a 5-section form, so the patient sees exactly those 5 titled screens with per-question controls inside each. Fewer transitions, still no chat box, one sticky Continue per screen.
- Sex moved from a standalone screen to one chip at the top of Section A — Vishal rightly flagged the schema already has "Not applicable" on Q6/Q7.

## 6. Everything else is borrowed, built is intentional

**Bought:** Vite + React + TypeScript, browser `localStorage`, Vercel static hosting. **Built:** per-question input components, conditionals + weighted progress, resume-with-TTL, bottom-sheet leave confirm, print/motion/320px CSS.

- The brief says "we judge judgement that reaches a working outcome fast, not code written from scratch." Reaching the outcome fast means buying scaffolding; the differentiation lives in the touches above.
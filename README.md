# Hair & Scalp Intake

> The intake that fills itself. Built for Haiku Studio take-home (Aug 2026).

A small web app that gets a patient through a 16-question hair-clinic intake without feeling like a form. **5 screens — the same 5 sections (A–E) as the doctor's form** — with big tap targets and per-question input choice, finishable by a 55-year-old on a phone. Only the filled form at the end is fixed — everything the patient sees is designed for feel.

**Live:** https://hair-intake.vercel.app  
**Repo:** https://github.com/Ripperox/hair-intake  
**Stack:** React + TypeScript + Vite — client-only, no keys, no backend.

---

## How to run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build
npm run preview  # preview dist/
```

No env vars. No API keys in repo. Works offline after load.

---

## Choices — bought vs built, models & services

**Guiding rule:** smallest thing that feels finished > biggest thing that half works. No paid services where a built-in does the job better.

| Decision | Choice | Why |
|---|---|---|
| **No LLM / no STT service** | Built deterministic logic | The 16 questions are fixed. An LLM would add ~$0.02 + 1.2s per step ×16 ≈ $0.32 and 19s wait, plus an API key and flakiness, for zero coverage gain. Determinism is a feature for a 55yo on a phone. Hinglish is in copy, not a model. |
| **No backend** | Client-only, `localStorage` for resume | No login/admin per rules. Persisting answers locally (7-day TTL) means a dropped call doesn't lose progress, and there's no PII on a server; the stored copy is wiped the moment the intake completes. The filled JSON is downloadable/copiable at the end — a real clinic would POST it; a static demo shouldn't pretend to store PHI. |
| **Vite + React** | Bought (off-the-shelf) | Fastest to a polished, deployable build. Typed schema → typed UI → typed JSON output in one codebase. No need for Django/DRF for a patient-facing step flow; a frontend-leaning hire should bias to where taste shows. |
| **5 screens, not 16 taps** | Built (grouped by schema sections) | The fixed output is a 5-section form — so the patient sees those same 5 titled screens (A–E). Fewer transitions than a 16-step wizard (that was the loudest PM feedback), zero loss of per-question controls. Each screen has one Continue, sticky on every device. |
| **Conditional questions** | Built (sex gate) | Sex is one chip at the top of Section A. Female-only Q6/Q7 appear only for female; for "prefer not to say" they surface with "Not applicable." Plumbing the field into the section, not a step, keeps the calm. |
| **Per-question input** | Built (`intake-components.tsx`) | Number stepper (age), single cards (duration/sample), multi chips with exclusive "None" (family/conditions), Yes/No, table-as-cards (habits/products/procedures). Each question gets the lightest control that answers it — not one chat box for everything. |
| **Speech, only where speech wins** | Built, Web Speech API | The two questions that are naturally spoken (describe salon treatments, describe side effects) get a Speak button → transcript → field. Client-side, free, Hinglish-tolerant (`en-IN`), no key. Advisably, "some are speech" — the tap questions stay taps. Voice notes: iOS Safari lacks recognition, so it degrades to a hint + typing. |
| **Inference, but only from entailment** | Built + one deliberately cut | I mapped all 16 questions for relationships (`docs/inference-map.md`). Only three survive: Q12's "side effects" answers Q14 outright, both skips together answer Q14 as No, and a man is never offered PCOS in Q5. Each derived answer says where it came from and can be overruled in one tap. What I cut: Q4 used to pre-mark the likeliest patterns from onset age + father's history. It demoed well and it's gone — pattern is the doctor's diagnostic signal, and a pre-marked chip nobody reads is an answer the patient never gave. The rule: **infer what the patient already told you, never what the doctor is there to read.** |
| **Phone vs laptop, designed separately** | Built (`use-is-desktop.ts` + CSS) | Phone: one section at a time, thumb-sized, sticky Next. Laptop gets a **desk console** — not a stretched phone: a sticky completion rail (A–E + Review) on the left, the whole 5-section form as one scrollable document in the middle (like the doctor's printed page), and a live "the form, filling itself" panel on the right that updates as answers land. Arrow keys move between sections, ⌘/Ctrl-Enter jumps to Review. Layout tiers by monitor width: 2-column on small laptops, 3-column from 1170px, centered + roomier from 1460px, and larger type/spacing on UHD (≥1800px). Same state engine, two genuinely different UIs. |
| **Sex question design** | Built, one chip in Section A | Male / Female / Prefer not to say. Female-only questions then gated — asked once, warmly, no extra screen. |
| **Styling** | Built, no UI library | Clinic red + warm paper, Fraunces display serif over system UI text, 52px tap targets, high contrast. No shadcn churn; keeps bundle small and the feel precise. |
| **Validation that guides, not scolds** | Built | Fields stay quiet until you try to continue with blanks — then the first missing answer scrolls into view and asks for attention. "If yes" follow-ups (smoking severity, salon detail, product rows) are required, so the doctor's JSON can't contain half-answered rows. |
| **Deploy** | Vercel static | One command, works without install — matches submission rule. |

**What I bought instead of built:** Vite, React, TypeScript, browser `localStorage`, Vercel hosting. Everything else is built to keep the app deterministic and finished.

---

## How I checked the form actually gets filled correctly

1. **Single source of truth:** `src/schema.ts` defines `Answers` — every question maps to a typed field. `App.tsx: buildFinalForm()` must produce all sections A–E; missing a field is a type error, and `npm run build` runs `tsc -b` (verbatimModuleSyntax, noUnusedLocals) so the JSON shape is type-checked on every build.
2. **"If yes" follow-ups are required, not optional:** smoking severity, salon-treatment detail, the side-effect description, and every opened product/procedure row's details all gate section completion (`src/validation.ts`). A used product with no duration can't reach Review.
3. **Nothing blank slips through:** each section's Continue checks completeness — tap it with blanks and the first missing answer is scrolled to and marked. The Review screen re-checks all five sections and blocks Confirm with a tap-to-fix list.
4. **Manual walkthroughs against the published schema:** male flow (Q6/Q7 recorded as "Not applicable" in the JSON, exactly as a man would tick the paper form), female flow (Q6/Q7 asked), and "prefer not to say" (asked, with Not applicable offered) — each walked on a 390px phone viewport and on desktop, then the final JSON compared field-by-field against `haikustudio.ai/hiring/intake-schema.json`. Also verified: localStorage resume, back navigation, Copy/Download.

---

## Taste map — the 16 questions, per-question design

Every question gets the control that answers it fastest. No shared default input; never one chat box.

| Q | Question | Primer | Control | Why |
|---|---|---|---|---|
| 1 | Age hair loss began | A · Personal & family | **Typed number ± stepper** | Just "28" + Enter. Faster and more precise than a slider or cards. |
| 2 | How long | A | **3 cards, one tap** | Just "Less than 6 months" — zero thought. |
| 3 | Family history | A | **Chips, exclusive "None"** | Pick several relatives; "No known family history" clears the rest. |
| 4 | Pattern | A | **Chips, nothing pre-marked** | Six patterns, tap any that match. Deliberately not pre-filled — see the inference decision above. |
| 5 | Diagnosed conditions | B · Hormonal & health | **Chips, exclusive "None"** | Same light multiselect; private-to-doctor copy. |
| 6 | Menstrual cycle | B | **Cards, one tap** | Appears only if sex = female — men never see it (gating). |
| 7 | Pregnancy-related | B | **Cards, one tap** | Appears only if sex = female. |
| 8 | Acne / oily skin | B | **Yes/No, one tap** | Boolean = two big buttons. |
| 9 | Excess body/facial hair | B | **Yes/No, one tap** | Boolean. |
| 10 | Last-6-months triggers | C · Lifestyle | **Chips, allow-empty** | "If nothing happened, just Continue" — answering none is legitimate. |
| 11 | Daily habits | C | **Table-as-cards + speech** | Lifestyle vs hair-care groups; sub-questions unfold only when the row is "yes"; salon treatments detail is **voice or type** (Web Speech, en-IN). |
| 12 | Products tried | D · Treatments | **Fast-path skip** | "Never used any → skip" answers 5 rows in one tap; rows open only when marked Used. |
| 13 | Procedures | D | **Fast-path skip** | "None done → skip" in one tap; sessions/helped expand only when Done. |
| 14 | Side effects / poor response | D | **Often already answered** | If Q12 recorded a side effect, this is the same sentence twice — so it arrives answered, naming the product it came from, overrulable in one tap. If both tables were skipped there was no treatment to react to, so it answers No. Otherwise Yes/No, then speech or typing. |
| 15 | Sample type | E · Sample & consent | **Cards with sub-labels** | "Saliva – no needle" / "Blood – more DNA" / "Either". One decisive tap. |
| 16 | Consent | E | **Big checkbox card** | Deliberately the heaviest interaction in the flow — it's a legal consent. |

Mechanisms at a glance: **one-tap big targets ×6** (2, 6, 7, 8, 9, 15), **chips ×4** (3, 4, 5, 10), **speech or type ×2** (11, 14), **fast-path one-tap skip ×2** (12, 13), **inferred and confirmed ×1** (14), **typed number ×1** (1), **explicit consent choice ×1** (16). All 16 live on 5 screens.

## What I'd do with one more week

1. **Smudge-proof Hinglish + accent coverage** — the Web Speech `en-IN` transcript is solid but not perfect; a second pass with an accent-tolerant whisper fallback (serverless, env-held key) for iOS users who can't use Web Speech at all.
2. **Clinic handoff polish** — one-page doctor summary (red flags, hormonal signals, treatment history) alongside the raw JSON, plus a WhatsApp-share link (DermaAI's actual channel). Print stylesheet for the front desk.
3. **A11y & trust pass** — full screen-reader audit, larger font toggle, explicit DPDP consent copy, and field-level "why we ask this" explainers (e.g., "PCOS influences hair loss — your doctor uses this to choose tests").
4. **A "tell me in your own words" opener** — speak or type a few sentences up front, and use it to *reorder and pre-focus* questions rather than pre-answer them: the patient still taps every answer, but lands on the relevant ones first.

---

## Project structure

```
src/
  schema.ts              # Answers type + row keys + normalize on load
  App.tsx                # 5 section screens + flow + final JSON
  intake-components.tsx  # BigButton, OptionCard, ChipOption, YesNo, NumberStepper, VoicedTextArea…  
  use-is-desktop.ts      # phone vs laptop (≥1024px) split
  index.css              # clinic red theme, mobile-first
```

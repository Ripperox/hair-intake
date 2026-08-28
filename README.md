# GenoRoot — Hair & Scalp Intake

> The intake that fills itself. Built for Haiku Studio take-home (Aug 2026).

A small web app that gets a patient through a 16-question hair-clinic intake without feeling like a form. One question at a time, big tap targets, per-question input choice, finishable by a 55-year-old on a phone. Only the filled form at the end is fixed — everything the patient sees is designed for feel.

**Live:** _(add Vercel URL after deploy)_  
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
| **No LLM / no STT service** | Built deterministic logic | The 16 questions are fixed. An LLM would add latency, cost, flakiness and an API key for zero coverage gain. For a 55yo on a phone, determinism is a feature. Hinglish phrasing is in copy, not in a model. |
| **No backend** | Client-only, `localStorage` for resume | No login/admin per rules. Persisting answers locally means a dropped call doesn't lose progress, and there's no PII on a server. The filled JSON is downloadable/copiable at the end — a real clinic would POST it; a static demo shouldn't pretend to store PHI. |
| **Vite + React** | Bought (off-the-shelf) | Fastest to a polished, deployable build. Typed schema → typed UI → typed JSON output in one codebase. No need for Django/DRF for a patient-facing step flow; a frontend-leaning hire should bias to where taste shows. |
| **Progress & conditional steps** | Built (`intake-steps.ts`) | Female-only Q6/Q7 appear only if sex=female — otherwise skipped. Weight-aware progress so tables don't jump the bar. This is the "infer and just confirm" taste the brief asks for. |
| **Per-question input** | Built (`intake-components.tsx`) | Number stepper (age), single cards (duration/sample), multi chips with exclusive "None" (family/conditions), Yes/No, table-as-cards (habits/products/procedures). Each question gets the lightest control that answers it — not one chat box for everything. |
| **Sex question design** | Built, first after welcome | Asked once, warmly: "Some questions differ for women…" with Male/Female/Prefer not to say + Skip. Female-only questions then gated. Asking once is more respectful than inferring or repeating. |
| **Styling** | Built, no UI library | Clinic-grade palette (warm paper + deep forest), 52px tap targets, high contrast. No shadcn churn; keeps bundle small and feel precise. |
| **Deploy** | Vercel static | One command, works without install — matches submission rule. |

**What I bought instead of built:** Vite, React, TypeScript, browser `localStorage`, Vercel hosting. Everything else is built to keep the app deterministic and finished.

---

## How I checked the form actually gets filled correctly

1. **Single source of truth:** `src/schema.ts` defines `Answers` — every question maps to a typed field. `App.tsx: buildFinalForm()` must produce all sections A–E; missing a field is a type error.
2. **Coverage check:** the stepper `STEPS` array is derived from the PDF's 16 questions + sex context. Conditional steps (Q6/Q7) are unit-tested by flipping `sex` and asserting `getVisibleSteps()` length.
3. **Manual walkthroughs:** male flow (skips Q6/Q7, 18 steps), female flow (includes Q6/Q7, 20 steps), and "prefer not to say" flow — each walked on a phone viewport (390px) and desktop. Verified localStorage resume, back navigation, and the final JSON `Copy`/`Download`.
4. **Built output:** `npm run build` passes `tsc -b` (verbatimModuleSyntax, noUnusedLocals) — the JSON shape is type-checked.

---

## What I'd do with one more week

1. **Voice as an *optional* assist, not a mode** — Web Speech API per field (tap the mic next to Age or Describe) with Hinglish-tuned hints, plus a server whisper fallback for low-end Android. The current build skips voice deliberately to stay finished; a week lets it be additive.
2. **Clinic handoff polish** — generate a one-page doctor summary (red flags, hormonal signals, treatment history) alongside the raw JSON, plus a WhatsApp-share link (DermaAI's actual channel). Print stylesheet for the front desk.
3. **A11y & trust pass** — full screen-reader audit, larger font toggle, explicit DPDP consent copy, and field-level "why we ask this" explainers (e.g., "PCOS influences hair loss — your doctor uses this to choose tests").
4. **Light inference** — e.g., if `age ≤ 22` and `familyHistory` includes father, pre-highlight "receding hairline / crown thinning" as a confirmable suggestion rather than an assumption. Always confirm, never auto-fill.

---

## Project structure

```
src/
  schema.ts              # Answers type + EMPTY_ANSWERS
  intake-steps.ts        # ordered steps, visibility (female-only), progress
  intake-components.tsx  # BigButton, OptionCard, ChipOption, YesNo, NumberStepper…
  App.tsx                # flow + per-question rendering + final JSON
  index.css              # clinic theme, mobile-first
```

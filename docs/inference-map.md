# Which answers the form can work out for itself

The brief asks for questions that are "inferred from an earlier answer and just confirmed."
This is every relationship between the 16 questions, sorted into the ones that are safe to act
on and the ones that only look safe.

**The rule that separates them:**

> Infer what the patient has already told you. Never infer what the doctor is there to read.

---

## The three kinds of relationship

**Gate** — one answer decides whether another is asked. *Built.*
Sex → Q6, Q7. The patient told us their sex, so the form never asks a man about his menstrual
cycle; it writes "Not applicable" and moves on. Same logic as every "if yes" follow-up in Q11–Q14.

**Entailment** — the answer is already contained in an earlier one. *Worth building.*
Q12, Q13 → Q14. If they ticked "side effects" on minoxidil, they have already answered Q14.
If they tapped both skips, there was no past treatment, so Q14 is No. Nothing is invented —
it is their own answer, restated.

**Correlation** — clinically real, but not the patient's answer to give. *Rejected.*
Early onset plus a balding father really does predict a receding hairline. But that prediction
is the doctor's to make, and a pre-marked chip nobody reads becomes an answer the patient
never gave.

---

## Every relationship, and what it earns

| Relationship | Kind | Verdict |
|---|---|---|
| Sex → Q6, Q7 | Gate | **Built.** Asked once in Section A. Male or undisclosed never sees them; the output records "Not applicable", exactly as a man would tick the paper form. |
| Q11 smoking = yes → severity | Gate | **Built.** Appears only on yes, and is required — the doctor can't receive "smokes: yes, amount: blank". |
| Q11 salon = yes → which ones | Gate | **Built.** Speech or typing, because it's the one question people answer in a sentence. |
| Q12 used = yes → duration, helped, side effects | Gate | **Built.** Three columns open per row, only for rows marked Used. Untouched rows stay one tap. |
| Q13 done = yes → sessions, helped | Gate | **Built.** As above, for procedures. |
| Q12 any side effect = yes → Q14 = Yes | Entailment | **Build.** Strict entailment — they reported a side effect from a past treatment, which is the literal text of Q14. Pre-set it and show the confirm. |
| Q12 none used + Q13 none done → Q14 = No | Entailment | **Build.** There is no past treatment to have responded badly to. The two skip buttons should answer Q14 on the way past — one tap fewer, and it cannot be wrong. |
| Q13 any helped = no → Q14 = Yes | Entailment | **Build.** "Poor response to past treatment" is what they just said. Weaker than the side-effect edge, so it lands on the confirm rather than silently. |
| Sex = male → hide PCOS/PCOD in Q5 | Gate | **Optional.** A man cannot have PCOS. Coverage unchanged — the option simply can't apply. |
| Q1 ≤ 25 + Q3 father → Q4 pattern | Correlation | **Rejected.** Built, then removed. Pattern is the doctor's diagnostic signal; pre-marking it puts words in the patient's mouth on the question where that costs most. |
| Q5 PCOS ↔ Q8 acne ↔ Q9 excess hair | Correlation | **Rejected.** A hormonal cluster the doctor reads across three independent observations. Deriving one from another destroys the agreement that makes the cluster meaningful. |
| Q10 fever + Q2 < 6 months → Q4 sudden shedding | Correlation | **Rejected.** Textbook telogen effluvium — and textbook is the point. That's a diagnosis, not something the patient saw in the mirror. |
| Q6 irregular → Q5 PCOS | Correlation | **Rejected.** Q5 asks what a doctor has *diagnosed*. Irregular cycles are a *symptom*. Turning a symptom into a diagnosis is the one error a genetic intake must never make. |

---

## What this costs to build

Three edges, all inside Section D, all deterministic. Q14 gains a pre-set value plus a confirm
line that names where the answer came from — so it reads as the form keeping up, not the form
deciding.

**When a side effect was already reported:**

```
You mentioned side effects with topical minoxidil, so we've marked this Yes.
Not right? Tap No.
```

Names the source answer, states what was done, and offers the exit in the same breath. The
patient can always overrule it, and the doctor sees a field the patient confirmed rather than
one the software assumed.

**When both skips were tapped:**

```
No products, no procedures — so there's nothing to have reacted to.
We've marked this No.
```

The one place inference removes a question entirely instead of pre-filling it: with no
treatment history, Q14 has exactly one possible answer.

---

## Why so few

Almost nothing in this form is genuinely inferable, and that is by design — a doctor reading
the sheet wants each question to be an independent observation. Only three relationships are
real, and all three live inside Section D. Everything else that *feels* inferable is
correlation: true often enough to be tempting, wrong often enough to corrupt the record.

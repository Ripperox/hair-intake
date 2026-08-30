// Validation helpers — positive validation: show success when field is correct

export type ValidationState = 'idle' | 'valid' | 'invalid'

export interface FieldValidation {
  state: ValidationState
  message?: string
}

// Age: 10-100
export function validateAge(value: string): FieldValidation {
  if (!value || value.trim() === '') return { state: 'idle' }
  const n = parseInt(value, 10)
  if (isNaN(n)) return { state: 'invalid', message: 'Enter a number' }
  if (n < 10 || n > 100) return { state: 'invalid', message: 'Age must be 10-100' }
  return { state: 'valid' }
}

// Required single select (duration, sample, cycle, pregnancy)
export function validateRequiredSelect(value: string | null): FieldValidation {
  if (!value) return { state: 'idle' }
  return { state: 'valid' }
}

// Required multi-select (family history, pattern, conditions, triggers) - at least one
export function validateRequiredMulti(values: string[]): FieldValidation {
  if (values.length === 0) return { state: 'idle' }
  return { state: 'valid' }
}

// Required boolean (Yes/No questions)
export function validateRequiredBoolean(value: boolean | null): FieldValidation {
  if (value === null) return { state: 'idle' }
  return { state: 'valid' }
}

// Required free text (follow-ups: "if yes, describe")
export function validateRequiredText(value: string | null): FieldValidation {
  if (!value || value.trim() === '') return { state: 'idle' }
  return { state: 'valid' }
}

// Section-level validation
export interface SectionValidation {
  isComplete: boolean
  fields: Record<string, FieldValidation>
}

export function validateSectionA(answers: {
  sex: string | null
  ageHairLossBegan: string
  duration: string | null
  familyHistory: string[]
  pattern: string[]
}): SectionValidation {
  const fields = {
    sex: validateRequiredSelect(answers.sex),
    ageHairLossBegan: validateAge(answers.ageHairLossBegan),
    duration: validateRequiredSelect(answers.duration),
    familyHistory: validateRequiredMulti(answers.familyHistory),
    pattern: validateRequiredMulti(answers.pattern),
  }
  const isComplete = Object.values(fields).every(f => f.state === 'valid')
  return { isComplete, fields }
}

export function validateSectionB(answers: {
  diagnosedConditions: string[]
  adultAcneOilySkin: boolean | null
  excessBodyFacialHair: boolean | null
  sex: string | null
  menstrualCycle: string | null
  pregnancyRelated: string | null
}): SectionValidation {
  const fields: Record<string, FieldValidation> = {
    diagnosedConditions: validateRequiredMulti(answers.diagnosedConditions),
    adultAcneOilySkin: validateRequiredBoolean(answers.adultAcneOilySkin),
    excessBodyFacialHair: validateRequiredBoolean(answers.excessBodyFacialHair),
  }
  // Female-only fields
  if (answers.sex === 'female') {
    fields.menstrualCycle = validateRequiredSelect(answers.menstrualCycle)
    fields.pregnancyRelated = validateRequiredSelect(answers.pregnancyRelated)
  } else if (answers.sex === 'other') {
    fields.menstrualCycle = validateRequiredSelect(answers.menstrualCycle)
    fields.pregnancyRelated = validateRequiredSelect(answers.pregnancyRelated)
  }
  const isComplete = Object.values(fields).every(f => f.state === 'valid')
  return { isComplete, fields }
}

export function validateSectionC(answers: {
  smoking: boolean | null
  smokingSeverity: string | null
  alcohol: boolean | null
  hardWater: boolean | null
  hairWashFrequency: string | null
  heatingTools: boolean | null
  salonTreatments: boolean | null
  salonTreatmentDetail: string | null
}): SectionValidation {
  const fields: Record<string, FieldValidation> = {
    smoking: validateRequiredBoolean(answers.smoking),
    alcohol: validateRequiredBoolean(answers.alcohol),
    hardWater: validateRequiredBoolean(answers.hardWater),
    hairWashFrequency: validateRequiredSelect(answers.hairWashFrequency),
    heatingTools: validateRequiredBoolean(answers.heatingTools),
    salonTreatments: validateRequiredBoolean(answers.salonTreatments),
  }
  // "if yes" follow-ups are part of the answer, not optional extras
  if (answers.smoking) fields.smokingSeverity = validateRequiredSelect(answers.smokingSeverity)
  if (answers.salonTreatments) fields.salonTreatmentDetail = validateRequiredText(answers.salonTreatmentDetail)
  const isComplete = Object.values(fields).every(f => f.state === 'valid')
  return { isComplete, fields }
}

type ProductLike = { used: boolean; duration: string | null; helped: boolean | null; sideEffects: boolean | null }
type ProcedureLike = { done: boolean; sessions: string | null; helped: boolean | null }

export function productRowComplete(p: ProductLike): boolean {
  return !p.used || (p.duration !== null && p.helped !== null && p.sideEffects !== null)
}

export function procedureRowComplete(p: ProcedureLike): boolean {
  return !p.done || (p.sessions !== null && p.helped !== null)
}

export function validateSectionD(answers: {
  products: Record<string, ProductLike>
  procedures: Record<string, ProcedureLike>
  pastTreatmentSideEffects: boolean | null
  pastTreatmentDescribe: string | null
  /** False when Q14's Yes was derived from Q12 — the doctor already has the
      product row that says so, and we shouldn't invent work for the patient. */
  requireDescribe: boolean
}): SectionValidation {
  const fields: Record<string, FieldValidation> = {
    pastTreatmentSideEffects: validateRequiredBoolean(answers.pastTreatmentSideEffects),
  }
  if (answers.pastTreatmentSideEffects && answers.requireDescribe) fields.pastTreatmentDescribe = validateRequiredText(answers.pastTreatmentDescribe)
  // Only surfaced when a row is genuinely half-filled. A blank form has no
  // open rows, so this must not read as an answered field.
  const rowsDone = Object.values(answers.products).every(productRowComplete)
    && Object.values(answers.procedures).every(procedureRowComplete)
  if (!rowsDone) fields.rows = { state: 'idle' }
  const isComplete = Object.values(fields).every(f => f.state === 'valid')
  return { isComplete, fields }
}

export function validateSectionE(answers: {
  sampleType: string | null
  consent: boolean | null
}): SectionValidation {
  const fields = {
    sampleType: validateRequiredSelect(answers.sampleType),
    consent: validateRequiredBoolean(answers.consent),
  }
  const isComplete = Object.values(fields).every(f => f.state === 'valid')
  return { isComplete, fields }
}
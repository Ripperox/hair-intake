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

// Section-level validation
export interface SectionValidation {
  isComplete: boolean
  fields: Record<string, FieldValidation>
}

export function validateSectionA(answers: {
  ageHairLossBegan: string
  duration: string | null
  familyHistory: string[]
  pattern: string[]
}): SectionValidation {
  const fields = {
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
  alcohol: boolean | null
  hardWater: boolean | null
  hairWashFrequency: string | null
  heatingTools: boolean | null
  salonTreatments: boolean | null
}): SectionValidation {
  const fields = {
    smoking: validateRequiredBoolean(answers.smoking),
    alcohol: validateRequiredBoolean(answers.alcohol),
    hardWater: validateRequiredBoolean(answers.hardWater),
    hairWashFrequency: validateRequiredSelect(answers.hairWashFrequency),
    heatingTools: validateRequiredBoolean(answers.heatingTools),
    salonTreatments: validateRequiredBoolean(answers.salonTreatments),
  }
  const isComplete = Object.values(fields).every(f => f.state === 'valid')
  return { isComplete, fields }
}

export function validateSectionD(answers: {
  pastTreatmentSideEffects: boolean | null
}): SectionValidation {
  const fields = {
    pastTreatmentSideEffects: validateRequiredBoolean(answers.pastTreatmentSideEffects),
  }
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
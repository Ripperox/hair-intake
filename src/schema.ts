// The intake schema — mirrors haikustudio.ai/hiring/intake-schema.json.
// Single source of truth for both the rendering and the final JSON output.

export type ProductEntry = { used: boolean; duration: string | null; helped: boolean | null; sideEffects: boolean | null }
export type ProcedureEntry = { done: boolean; sessions: string | null; helped: boolean | null }

export const PRODUCT_ROW_KEYS = ['OTC/Medicated Shampoos','Hair Oils/Serums','Topical Minoxidil','Oral Minoxidil','Supplements'] as const
export const PROCEDURE_ROW_KEYS = ['PRP/GFC/iPRF','Stem Cells/Exosomes','Hair Transplant','Other'] as const

// Autocomplete hints for browser autofill
export const AUTOCOMPLETE_HINTS: Record<string, string> = {
  ageHairLossBegan: 'off', // custom field, no standard autocomplete
  sex: 'sex',
  duration: 'off',
  familyHistory: 'off',
  pattern: 'off',
  diagnosedConditions: 'off',
  menstrualCycle: 'off',
  pregnancyRelated: 'off',
  adultAcneOilySkin: 'off',
  excessBodyFacialHair: 'off',
  past6Months: 'off',
  smoking: 'off',
  smokingSeverity: 'off',
  alcohol: 'off',
  hardWater: 'off',
  hairWashFrequency: 'off',
  heatingTools: 'off',
  salonTreatments: 'off',
  salonTreatmentDetail: 'off',
  pastTreatmentSideEffects: 'off',
  pastTreatmentDescribe: 'off',
  sampleType: 'off',
  consent: 'off',
}

const PRODUCT_ROW_DEFAULTS: Record<typeof PRODUCT_ROW_KEYS[number], ProductEntry> = {
  'OTC/Medicated Shampoos': { used: false, duration: null, helped: null, sideEffects: null },
  'Hair Oils/Serums': { used: false, duration: null, helped: null, sideEffects: null },
  'Topical Minoxidil': { used: false, duration: null, helped: null, sideEffects: null },
  'Oral Minoxidil': { used: false, duration: null, helped: null, sideEffects: null },
  'Supplements': { used: false, duration: null, helped: null, sideEffects: null },
}

const PROCEDURE_ROW_DEFAULTS: Record<typeof PROCEDURE_ROW_KEYS[number], ProcedureEntry> = {
  'PRP/GFC/iPRF': { done: false, sessions: null, helped: null },
  'Stem Cells/Exosomes': { done: false, sessions: null, helped: null },
  'Hair Transplant': { done: false, sessions: null, helped: null },
  'Other': { done: false, sessions: null, helped: null },
}

export function normalizeAnswers(raw: any): Answers {
  const base = EMPTY_ANSWERS
  const products: Answers['products'] = {}
  for (const k of PRODUCT_ROW_KEYS) {
    products[k] = { ...PRODUCT_ROW_DEFAULTS[k], ...(raw?.products?.[k] ?? {}) }
  }
  const procedures: Answers['procedures'] = {}
  for (const k of PROCEDURE_ROW_KEYS) {
    procedures[k] = { ...PROCEDURE_ROW_DEFAULTS[k], ...(raw?.procedures?.[k] ?? {}) }
  }
  return { ...base, ...raw, products, procedures } as Answers
}

export type Answers = {
  ageHairLossBegan: string
  duration: string | null
  familyHistory: string[]
  pattern: string[]
  diagnosedConditions: string[]
  menstrualCycle: string | null
  pregnancyRelated: string | null
  adultAcneOilySkin: boolean | null
  excessBodyFacialHair: boolean | null
  past6Months: string[]
  smoking: boolean | null
  smokingSeverity: string | null
  alcohol: boolean | null
  hardWater: boolean | null
  hairWashFrequency: string | null
  heatingTools: boolean | null
  salonTreatments: boolean | null
  salonTreatmentDetail: string | null
  products: Record<string, ProductEntry>
  procedures: Record<string, ProcedureEntry>
  pastTreatmentSideEffects: boolean | null
  pastTreatmentDescribe: string | null
  sampleType: string | null
  consent: boolean | null
  sex: string | null
}

export const EMPTY_ANSWERS: Answers = {
  ageHairLossBegan: '',
  duration: null,
  familyHistory: [],
  pattern: [],
  diagnosedConditions: [],
  menstrualCycle: null,
  pregnancyRelated: null,
  adultAcneOilySkin: null,
  excessBodyFacialHair: null,
  past6Months: [],
  smoking: null,
  smokingSeverity: null,
  alcohol: null,
  hardWater: null,
  hairWashFrequency: null,
  heatingTools: null,
  salonTreatments: null,
  salonTreatmentDetail: null,
  products: PRODUCT_ROW_DEFAULTS,
  procedures: PROCEDURE_ROW_DEFAULTS,
  pastTreatmentSideEffects: null,
  pastTreatmentDescribe: null,
  sampleType: null,
  consent: null,
  sex: null,
}

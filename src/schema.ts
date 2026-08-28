// The intake schema — mirrors haikustudio.ai/hiring/intake-schema.json.
// Single source of truth for both the rendering and the final JSON output.

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
  products: Record<string, { used: boolean; duration: string | null; helped: boolean | null; sideEffects: boolean | null }>
  procedures: Record<string, { done: boolean; sessions: string | null; helped: boolean | null }>
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
  products: {
    'Medicated Shampoos': { used: false, duration: null, helped: null, sideEffects: null },
    'Hair Oils/Serums': { used: false, duration: null, helped: null, sideEffects: null },
    'Topical Minoxidil': { used: false, duration: null, helped: null, sideEffects: null },
    'Oral Minoxidil': { used: false, duration: null, helped: null, sideEffects: null },
    'Supplements': { used: false, duration: null, helped: null, sideEffects: null },
  },
  procedures: {
    'PRP/GFC/iPRF': { done: false, sessions: null, helped: null },
    'Stem Cells/Exosomes': { done: false, sessions: null, helped: null },
    'Hair Transplant': { done: false, sessions: null, helped: null },
    'Other': { done: false, sessions: null, helped: null },
  },
  pastTreatmentSideEffects: null,
  pastTreatmentDescribe: null,
  sampleType: null,
  consent: null,
  sex: null,
}

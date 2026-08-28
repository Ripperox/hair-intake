import type { Answers } from './schema'

export type StepId =
  | 'welcome'
  | 'sex'
  | 'q1'
  | 'q2'
  | 'q3'
  | 'q4'
  | 'q5'
  | 'q6'
  | 'q7'
  | 'q8'
  | 'q9'
  | 'q10'
  | 'q11'
  | 'q12'
  | 'q13'
  | 'q14'
  | 'q15'
  | 'q16'
  | 'summary'
  | 'done'

export interface StepDef {
  id: StepId
  label: string
  canRender: (answers: Answers) => boolean
  progressWeight: number
}

const isFemale = (answers: Answers) => answers.sex === 'female'

export const STEPS: StepDef[] = [
  { id: 'welcome', label: 'Welcome', canRender: () => true, progressWeight: 0 },
  { id: 'sex', label: 'Context', canRender: () => true, progressWeight: 1 },
  { id: 'q1', label: 'Age started', canRender: () => true, progressWeight: 1 },
  { id: 'q2', label: 'Duration', canRender: () => true, progressWeight: 1 },
  { id: 'q3', label: 'Family history', canRender: () => true, progressWeight: 1 },
  { id: 'q4', label: 'Pattern', canRender: () => true, progressWeight: 1 },
  { id: 'q5', label: 'Conditions', canRender: () => true, progressWeight: 1 },
  { id: 'q6', label: 'Cycle', canRender: isFemale, progressWeight: 1 },
  { id: 'q7', label: 'Pregnancy', canRender: isFemale, progressWeight: 1 },
  { id: 'q8', label: 'Acne/oily skin', canRender: () => true, progressWeight: 1 },
  { id: 'q9', label: 'Excess hair', canRender: () => true, progressWeight: 1 },
  { id: 'q10', label: 'Triggers', canRender: () => true, progressWeight: 1 },
  { id: 'q11', label: 'Habits', canRender: () => true, progressWeight: 1.5 },
  { id: 'q12', label: 'Products', canRender: () => true, progressWeight: 1.5 },
  { id: 'q13', label: 'Procedures', canRender: () => true, progressWeight: 1.5 },
  { id: 'q14', label: 'Side effects', canRender: () => true, progressWeight: 1 },
  { id: 'q15', label: 'Sample type', canRender: () => true, progressWeight: 1 },
  { id: 'q16', label: 'Consent', canRender: () => true, progressWeight: 1 },
  { id: 'summary', label: 'Review', canRender: () => true, progressWeight: 1 },
  { id: 'done', label: 'Complete', canRender: () => true, progressWeight: 0 },
]

export function getVisibleSteps(answers: Answers): StepId[] {
  return STEPS.filter((s) => s.canRender(answers)).map((s) => s.id)
}

export function getStepIndex(stepId: StepId, answers: Answers): number {
  return getVisibleSteps(answers).indexOf(stepId)
}

export function getStepCount(answers: Answers): number {
  return getVisibleSteps(answers).length
}

export function getProgress(answers: Answers, currentStep: StepId): number {
  const visible = getVisibleSteps(answers)
  const idx = visible.indexOf(currentStep)
  if (idx <= 0) return 0
  let weight = 0
  let total = 0
  for (let i = 0; i < visible.length; i++) {
    const w = STEPS.find((s) => s.id === visible[i])?.progressWeight ?? 1
    total += w
    if (i < idx) weight += w
  }
  return Math.round((weight / total) * 100)
}

export function getNextStep(current: StepId, answers: Answers): StepId | null {
  const visible = getVisibleSteps(answers)
  const idx = visible.indexOf(current)
  if (idx >= 0 && idx < visible.length - 1) return visible[idx + 1]
  return null
}

export function getPrevStep(current: StepId, answers: Answers): StepId | null {
  const visible = getVisibleSteps(answers)
  const idx = visible.indexOf(current)
  if (idx > 0) return visible[idx - 1]
  return null
}

export function isLastStep(current: StepId, answers: Answers): boolean {
  const visible = getVisibleSteps(answers)
  return visible[visible.length - 1] === current
}

export function isFirstStep(current: StepId, answers: Answers): boolean {
  const visible = getVisibleSteps(answers)
  return visible[0] === current
}

export function initialAnswers(): Answers {
  return JSON.parse(JSON.stringify({
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
  })) as Answers
}
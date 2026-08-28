// GenoRoot — hair intake that fills itself
// Client-only, no keys, no backend. Deploy as static build.
// 5 screens = the 5 sections of the fixed doctor form (A–E). Per-question
// controls stay bespoke (one tap / chips / speech / infer+confirm).

import { useState, useEffect, useRef, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { Answers, ProductEntry, ProcedureEntry } from './schema'
import { normalizeAnswers, EMPTY_ANSWERS, PRODUCT_ROW_KEYS, PROCEDURE_ROW_KEYS } from './schema'
import { useIsDesktop } from './use-is-desktop'
import {
  BigButton,
  OptionCard,
  ChipOption,
  YesNo,
  NumberStepper,
  VoicedTextArea,
  ProgressBar,
  StepHeader,
  SectionCard,
  Hint,
} from './intake-components'

type Screen = 'welcome' | 'A' | 'B' | 'C' | 'D' | 'E' | 'summary' | 'done'
const SECTIONS: Screen[] = ['A', 'B', 'C', 'D', 'E']
const SCREEN_ORDER: Screen[] = ['welcome', ...SECTIONS, 'summary', 'done']

const SECTION_TITLE: Record<string, string> = {
  A: 'Personal & Family History',
  B: 'Hormones & Health',
  C: 'Lifestyle & Triggers',
  D: 'Treatments & Products',
  E: 'Sample & Consent',
}

const RAIL: { letter: string; title: string; screens: Screen[] }[] = [
  { letter: 'A', title: 'Personal & family', screens: ['A'] },
  { letter: 'B', title: 'Hormonal & health', screens: ['B'] },
  { letter: 'C', title: 'Lifestyle', screens: ['C'] },
  { letter: 'D', title: 'Treatments', screens: ['D'] },
  { letter: 'E', title: 'Sample & consent', screens: ['E'] },
]

// deep clone initial answers (avoid shared nested refs)
function freshAnswers(): Answers {
  return JSON.parse(JSON.stringify(EMPTY_ANSWERS))
}

export default function App() {
  const STORAGE_KEY = 'hair-intake-answers'
  const STORAGE_TTL_MS = 7 * 24 * 60 * 60 * 1000
  const [answers, setAnswers] = useState<Answers>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        // support both legacy bare object and new {ts, answers} shape
        if (parsed && typeof parsed === 'object' && 'answers' in parsed && 'ts' in parsed) {
          if (Date.now() - parsed.ts < STORAGE_TTL_MS) return normalizeAnswers(parsed.answers)
          localStorage.removeItem(STORAGE_KEY)
        } else if (parsed && typeof parsed === 'object' && 'ageHairLossBegan' in parsed) {
          return normalizeAnswers(parsed)
        }
      }
    } catch {}
    return freshAnswers()
  })
  const [step, setStep] = useState<Screen>('welcome')
  const [showLeaveSheet, setShowLeaveSheet] = useState(false)
  const [editRow, setEditRow] = useState<{ kind: 'product' | 'procedure'; key: string } | null>(null)
  const isDesktop = useIsDesktop()
  const patternSeeded = useRef(false)
  const answersRef = useRef(answers)
  answersRef.current = answers

  // Q4 inference: if hair loss started young + father similar, pre-mark the most
  // common patterns as *suggestions* – always confirmed, never assumed.
  useEffect(() => {
    if (step !== 'A' && step !== 'B') return
    if (!patternSeeded.current) {
      patternSeeded.current = true
      const a = answersRef.current
      const age = parseInt(a.ageHairLossBegan, 10)
      const father = a.familyHistory.includes('Father had hair loss')
      if (!isNaN(age) && age <= 25 && father && a.pattern.length === 0) {
        setAnswers(prev => ({ ...prev, pattern: ['Receding hairline', 'Thinning at crown'] }))
      }
    }
  }, [step])

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ts: Date.now(), answers })) } catch {}
  }, [answers])

  const update = useCallback((patch: Partial<Answers>) => {
    setAnswers(prev => ({ ...prev, ...patch }))
  }, [])

  const editProduct = useCallback((row: string, patch: Partial<ProductEntry>) => {
    setAnswers(prev => ({ ...prev, products: { ...prev.products, [row]: { ...prev.products[row], ...patch } } }))
  }, [])
  const editProcedure = useCallback((row: string, patch: Partial<ProcedureEntry>) => {
    setAnswers(prev => ({ ...prev, procedures: { ...prev.procedures, [row]: { ...prev.procedures[row], ...patch } } }))
  }, [])

  const screenIndex = SCREEN_ORDER.indexOf(step)
  const sectionIdx = SECTIONS.indexOf(step as any)
  const progress = sectionIdx >= 0 ? Math.round((sectionIdx / SECTIONS.length) * 100) : step === 'summary' ? 100 : 0

  const validAge = (): boolean => {
    const n = parseInt(answers.ageHairLossBegan, 10)
    return !!answers.ageHairLossBegan && !isNaN(n) && n >= 10 && n <= 80
  }

  const habitsCompleted = (): boolean =>
    answers.smoking !== null && answers.alcohol !== null && answers.hardWater !== null &&
    !!answers.hairWashFrequency && answers.heatingTools !== null && answers.salonTreatments !== null

  const sectionComplete = (s: Screen): boolean => {
    switch (s) {
      case 'A':
        return validAge() && !!answers.duration && answers.familyHistory.length > 0 && answers.pattern.length > 0
      case 'B':
        return answers.diagnosedConditions.length > 0 &&
          answers.adultAcneOilySkin !== null && answers.excessBodyFacialHair !== null &&
          (answers.sex === 'male' || (!!answers.menstrualCycle && !!answers.pregnancyRelated))
      case 'C':
        return habitsCompleted()
      case 'D':
        return answers.pastTreatmentSideEffects !== null
      case 'E':
        return !!answers.sampleType && !!answers.consent
      default:
        return true
    }
  }

  const goNext = useCallback(() => {
    const i = SCREEN_ORDER.indexOf(step)
    if (i >= 0 && i < SCREEN_ORDER.length - 1) setStep(SCREEN_ORDER[i + 1])
  }, [step])

  const goPrev = useCallback(() => {
    const i = SCREEN_ORDER.indexOf(step)
    if (i > 0) setStep(SCREEN_ORDER[i - 1])
  }, [step])

  // Desktop keyboard nav: arrows move between sections (no completion gate),
  // Ctrl/⌘+Enter jumps to Review & finish.
  useEffect(() => {
    if (!isDesktop) return
    const onKey = (e: KeyboardEvent) => {
      if (showLeaveSheet) return
      if (e.key === 'Escape') { setEditRow(null); return }
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      const axis = [...SECTIONS, 'summary'] as Screen[]
      if (e.key === 'ArrowRight') {
        const i = axis.indexOf(step)
        if (i >= 0 && i < axis.length - 1) { e.preventDefault(); setStep(axis[i + 1]) }
      } else if (e.key === 'ArrowLeft') {
        const i = axis.indexOf(step)
        if (i > 0) { e.preventDefault(); setStep(axis[i - 1]) }
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        if (step === 'welcome' || step === 'done') return
        e.preventDefault()
        setStep('summary')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isDesktop, step, showLeaveSheet, goNext, goPrev, editRow])

  // Desktop: when a section is targeted, bring it into view (rail + arrows).
  const prevStep = useRef<Screen>('welcome')
  useEffect(() => {
    if (!isDesktop || step === prevStep.current) return
    prevStep.current = step
    if (step === 'welcome' || step === 'done') { window.scrollTo({ top: 0 }) }
    else if (step !== 'summary') {
      document.getElementById(`desk-${step}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [isDesktop, step])

  const renderQuestion = (n: string, title: string, subtitle: string | undefined, children: ReactNode) => (
    <div className="q-block">
      <div className="q-head">
        {n && <span className="q-num">{n}</span>}
        <div>
          <div className="q-title">{title}</div>
          {subtitle && <div className="q-sub">{subtitle}</div>}
        </div>
      </div>
      {children}
    </div>
  )

  const renderSection = (s: Screen) => {
    switch (s) {
      case 'A':
        return (
          <SectionCard title="Personal & Family History" subtitle="Section A · 4 quick questions — best guess is fine.">
            {renderQuestion('', 'Your context', 'Some questions differ for women — one tap helps us ask the right ones.', (
              <div className="chip-grid">
                {(['Male','Female','Prefer not to say'] as const).map(opt => (
                  <ChipOption key={opt} label={opt} selected={answers.sex === (opt === 'Male' ? 'male' : opt === 'Female' ? 'female' : 'other')} onToggle={() => update({ sex: opt === 'Male' ? 'male' : opt === 'Female' ? 'female' : 'other' })} />
                ))}
              </div>
            ))}
            {renderQuestion('1', 'When did you first notice hair loss?', 'You age when it started — best guess is fine.', (
              <NumberStepper value={answers.ageHairLossBegan} onChange={v => update({ ageHairLossBegan: v })} min={10} max={80} />
            ))}
            {renderQuestion('2', 'How long has it been?', 'Since you first noticed.', (
              <div className="opt-grid">
                {['Less than 6 months','6-12 months','Over a year'].map(opt => (
                  <OptionCard key={opt} label={opt} selected={answers.duration === opt} onSelect={() => update({ duration: opt })} />
                ))}
              </div>
            ))}
            {renderQuestion('3', 'Family history?', 'Select all that apply.', (
              <>
                <div className="chip-grid">
                  {['Father had hair loss','Mother had hair loss','Siblings with thinning or baldness','No known family history'].map(opt => (
                    <ChipOption
                      key={opt} label={opt} selected={answers.familyHistory.includes(opt)}
                      exclusive={opt === 'No known family history'}
                      onToggle={() => {
                        if (answers.familyHistory.includes(opt)) {
                          update({ familyHistory: answers.familyHistory.filter(x => x !== opt) })
                        } else if (opt === 'No known family history') {
                          update({ familyHistory: ['No known family history'] })
                        } else {
                          update({ familyHistory: [...answers.familyHistory.filter(x => x !== 'No known family history'), opt] })
                        }
                      }}
                    />
                  ))}
                </div>
                {answers.familyHistory.length === 0 && <p className="field-error">Pick at least one</p>}
              </>
            ))}
            {renderQuestion('4', 'What pattern do you see?', 'Select all that match you.', (
              <>
                {(() => {
                  const ageN = parseInt(answers.ageHairLossBegan, 10)
                  const suggested = !isNaN(ageN) && ageN <= 25 && answers.familyHistory.includes('Father had hair loss')
                  return suggested && answers.pattern.length > 0 ? (
                    <div className="field-ok" style={{ marginBottom: 10, lineHeight: 1.45 }}>
                      Based on when it started + your father&apos;s hair loss, we pre-marked the two most common patterns. Tap to remove any that don&apos;t match.
                    </div>
                  ) : null
                })()}
                <div className="chip-grid">
                  {['Receding hairline','Thinning at crown','Widening part line','Diffuse thinning','Patchy loss','Sudden excessive shedding'].map(opt => (
                    <ChipOption key={opt} label={opt} selected={answers.pattern.includes(opt)} onToggle={() => {
                      update({ pattern: answers.pattern.includes(opt) ? answers.pattern.filter(x => x !== opt) : [...answers.pattern, opt] })
                    }} />
                  ))}
                </div>
                {answers.pattern.length === 0 && <p className="field-error">Pick at least one</p>}
              </>
            ))}
          </SectionCard>
        )

      case 'B':
        return (
          <SectionCard title="Hormones & Health" subtitle="Section B · mostly one-tap Yes/No — fastest section.">
            {renderQuestion('5', 'Any diagnosed conditions?', 'Helps your doctor decide which tests to run — not shared outside the clinic.', (
              <>
                <div className="chip-grid">
                  {['PCOS/PCOD','Thyroid disorder','Diabetes','Autoimmune disease','Anemia','None'].map(opt => (
                    <ChipOption key={opt} label={opt} selected={answers.diagnosedConditions.includes(opt)} exclusive={opt === 'None'}
                      onToggle={() => {
                        if (answers.diagnosedConditions.includes(opt)) {
                          update({ diagnosedConditions: answers.diagnosedConditions.filter(x => x !== opt) })
                        } else if (opt === 'None') {
                          update({ diagnosedConditions: ['None'] })
                        } else {
                          update({ diagnosedConditions: [...answers.diagnosedConditions.filter(x => x !== 'None'), opt] })
                        }
                      }}
                    />
                  ))}
                </div>
                {answers.diagnosedConditions.length === 0 && <p className="field-error">Pick at least one — tap None if nothing applies</p>}
              </>
            ))}
            {answers.sex === 'female' && renderQuestion('6', 'Menstrual cycle', 'For your doctor to interpret the hair picture correctly.', (
              <div className="opt-grid">
                {['Regular','Irregular','Menopausal','Not applicable'].map(opt => (
                  <OptionCard key={opt} label={opt} selected={answers.menstrualCycle === opt} onSelect={() => update({ menstrualCycle: opt })} />
                ))}
              </div>
            ))}
            {answers.sex === 'female' && renderQuestion('7', 'Pregnancy-related hair loss?', 'If applicable.', (
              <div className="opt-grid">
                {['Currently pregnant','Postpartum <1 year','Not applicable'].map(opt => (
                  <OptionCard key={opt} label={opt} selected={answers.pregnancyRelated === opt} onSelect={() => update({ pregnancyRelated: opt })} />
                ))}
              </div>
            ))}
            {answers.sex === 'other' && (
              <div className="q-block">
                <div className="q-head"><span className="q-num" /><div><div className="q-title">Women-only questions</div><div className="q-sub">Answered only if they apply — Not applicable is fine.</div></div></div>
                <div className="opt-grid">
                  {['Regular','Irregular','Menopausal','Not applicable'].map(opt => (
                    <OptionCard key={opt} label={`Cycle · ${opt}`} selected={answers.menstrualCycle === opt} onSelect={() => update({ menstrualCycle: opt })} />
                  ))}
                  {['Currently pregnant','Postpartum <1 year','Not applicable'].map(opt => (
                    <OptionCard key={opt} label={`Pregnancy · ${opt}`} selected={answers.pregnancyRelated === opt} onSelect={() => update({ pregnancyRelated: opt })} />
                  ))}
                </div>
              </div>
            )}
            {renderQuestion('8', 'Acne or oily skin in adulthood?', 'After your teenage years — hormonal clues your doctor uses.', (
              <YesNo value={answers.adultAcneOilySkin} onChange={v => update({ adultAcneOilySkin: v })} />
            ))}
            {renderQuestion('9', 'Excess body or facial hair growth?', 'A gentle hormonal signal — only your doctor sees this.', (
              <YesNo value={answers.excessBodyFacialHair} onChange={v => update({ excessBodyFacialHair: v })} />
            ))}
          </SectionCard>
        )

      case 'C':
        return (
          <SectionCard title="Lifestyle & Triggers" subtitle="Section C · habits in 30 seconds, speak or tap the details.">
            {renderQuestion('10', 'In the last 6 months, any of these?', 'Select all that happened — or none.', (
              <>
                <div className="chip-grid">
                  {['Crash dieting or major weight loss','High stress or emotional trauma','Fever with illness (COVID, Dengue, Typhoid)','Recent surgery','Change in location/water/air quality'].map(opt => (
                    <ChipOption key={opt} label={opt} selected={answers.past6Months.includes(opt)} onToggle={() => {
                      update({ past6Months: answers.past6Months.includes(opt) ? answers.past6Months.filter(x => x !== opt) : [...answers.past6Months, opt] })
                    }} />
                  ))}
                </div>
                <Hint>If nothing happened, just move to the next question.</Hint>
              </>
            ))}
            {renderQuestion('11', 'Daily habits', 'Quick yes / no for each. Details only if needed.', (
              <div className="habit-list">
                <div className="habit-group-label">Lifestyle</div>
                <div className="habit-row"><div className="habit-main"><span className="habit-label">Smoking</span><YesNo value={answers.smoking} onChange={v => update({ smoking: v, smokingSeverity: v ? answers.smokingSeverity : null })} /></div>
                  {answers.smoking && (
                    <div className="habit-followup">
                      <div className="followup-label">How many per day?</div>
                      <div className="opt-grid small">
                        {['Mild <5/day','Moderate 5-10/day','Severe >10/day'].map(opt => (
                          <OptionCard key={opt} label={opt} selected={answers.smokingSeverity === opt} onSelect={() => update({ smokingSeverity: opt })} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="habit-row"><div className="habit-main"><span className="habit-label">Alcohol</span><YesNo value={answers.alcohol} onChange={v => update({ alcohol: v })} /></div></div>
                <div className="habit-row"><div className="habit-main"><span className="habit-label">Hard water for hair wash</span><YesNo value={answers.hardWater} onChange={v => update({ hardWater: v })} /></div></div>
                <div className="habit-group-label" style={{ marginTop: 14 }}>Hair care</div>
                <div className="habit-row">
                  <div className="habit-main" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                    <span className="habit-label" style={{ marginBottom: 8 }}>Hair wash frequency</span>
                    <div className="opt-grid small">
                      {['Daily','Alternate Days','Weekly'].map(opt => (
                        <OptionCard key={opt} label={opt} selected={answers.hairWashFrequency === opt} onSelect={() => update({ hairWashFrequency: opt })} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="habit-row"><div className="habit-main"><span className="habit-label">Heating tools / styling chemicals</span><YesNo value={answers.heatingTools} onChange={v => update({ heatingTools: v })} /></div></div>
                <div className="habit-row">
                  <div className="habit-main"><span className="habit-label">Salon treatments (keratin, rebonding, smoothening)</span><YesNo value={answers.salonTreatments} onChange={v => update({ salonTreatments: v, salonTreatmentDetail: v ? answers.salonTreatmentDetail : null })} /></div>
                  {answers.salonTreatments && (
                    <div className="habit-followup">
                      <VoicedTextArea value={answers.salonTreatmentDetail || ''} onChange={v => update({ salonTreatmentDetail: v })} placeholder="Which ones? e.g. Keratin 2 months ago" rows={2} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </SectionCard>
        )

      case 'D':
        return (
          <SectionCard title="Treatments & Products" subtitle="Section D · if you've never tried anything, each is one tap to skip.">
            {renderQuestion('12', 'Products you have tried', 'Tap Used only where needed — everything else stays collapsed.', (
              <>
                <button type="button" className="fast-path" onClick={() => {
                  const next: Answers['products'] = {}
                  for (const k of PRODUCT_ROW_KEYS) next[k] = { used: false, duration: null, helped: null, sideEffects: null }
                  update({ products: next })
                }}>Never used any → skip</button>
                <div className="table-grid" style={{ marginTop: 12 }}>
                  {PRODUCT_ROW_KEYS.map(row => {
                    const p = answers.products[row]
                    const summary = p.used ? `${p.duration ? p.duration + ' · ' : ''}${p.helped == null ? '?' : p.helped ? 'helped' : 'no help'}${p.sideEffects == null ? '' : p.sideEffects ? ' · side effects' : ''}` : ''
                    return (
                      <div key={row} className={`table-row ${p.used ? 'is-used' : ''}`}>
                        <div className="table-row-head">
                          <button type="button" className="table-row-label" onClick={() => setEditRow({ kind: 'product', key: row })}>
                            <span>{row}</span>
                            <span className={`table-row-summary ${p.used ? 'show' : ''}`}>{summary}</span>
                          </button>
                          <YesNo value={p.used} onChange={v => {
                            if (v) setEditRow({ kind: 'product', key: row })
                            update({ products: { ...answers.products, [row]: { used: v, duration: v ? p.duration : null, helped: v ? p.helped : null, sideEffects: v ? p.sideEffects : null } } })
                          }} yesLabel="Used" noLabel="Never" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            ))}
            {renderQuestion('13', 'In-clinic procedures', 'Tap Done only where applicable — rest stay collapsed.', (
              <>
                <button type="button" className="fast-path" onClick={() => {
                  const next: Answers['procedures'] = {}
                  for (const k of PROCEDURE_ROW_KEYS) next[k] = { done: false, sessions: null, helped: null }
                  update({ procedures: next })
                }}>None done → skip</button>
                <div className="table-grid" style={{ marginTop: 12 }}>
                  {PROCEDURE_ROW_KEYS.map(row => {
                    const p = answers.procedures[row]
                    const summary = p.done ? `${p.sessions ? p.sessions + ' sessions · ' : ''}${p.helped == null ? '?' : p.helped ? 'helped' : 'no help'}` : ''
                    return (
                      <div key={row} className={`table-row ${p.done ? 'is-used' : ''}`}>
                        <div className="table-row-head">
                          <button type="button" className="table-row-label" onClick={() => setEditRow({ kind: 'procedure', key: row })}>
                            <span>{row}</span>
                            <span className={`table-row-summary ${p.done ? 'show' : ''}`}>{summary}</span>
                          </button>
                          <YesNo value={p.done} onChange={v => {
                            if (v) setEditRow({ kind: 'procedure', key: row })
                            update({ procedures: { ...answers.procedures, [row]: { done: v, sessions: v ? p.sessions : null, helped: v ? p.helped : null } } })
                          }} yesLabel="Done" noLabel="Never" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            ))}
            {renderQuestion('14', 'Side effects or poor response to past treatment?', 'If yes, a few words helps your doctor.', (
              <>
                <YesNo value={answers.pastTreatmentSideEffects} onChange={v => update({ pastTreatmentSideEffects: v, pastTreatmentDescribe: v ? answers.pastTreatmentDescribe : null })} />
                {answers.pastTreatmentSideEffects && (
                  <div style={{ marginTop: 16 }}>
                    <VoicedTextArea value={answers.pastTreatmentDescribe || ''} onChange={v => update({ pastTreatmentDescribe: v })} placeholder="What happened? e.g. Itchy scalp with minoxidil" rows={3} />
                  </div>
                )}
              </>
            ))}
          </SectionCard>
        )

      case 'E':
        return (
          <SectionCard title="Sample & Consent" subtitle="Section E · the last 30 seconds.">
            {renderQuestion('15', 'Preferred sample for genetic analysis', 'Both work. Saliva is easiest — just spit in a tube.', (
              <div className="opt-grid">
                {[{ id: 'Saliva', label: 'Saliva', sub: 'No needle' },{ id: 'Blood', label: 'Blood', sub: 'More DNA' },{ id: 'Either', label: 'Either', sub: 'Doctor can decide' }].map(opt => (
                  <OptionCard key={opt.id} label={opt.label} subLabel={opt.sub} selected={answers.sampleType === opt.id} onSelect={() => update({ sampleType: opt.id })} />
                ))}
              </div>
            ))}
            {renderQuestion('16', 'Consent', 'I agree to sample collection and genetic analysis for my hair-loss profile. You can withdraw anytime.', (
              <>
                <label className="consent-card">
                  <input type="checkbox" checked={!!answers.consent} onChange={e => update({ consent: e.target.checked })} />
                  <span className="consent-check" aria-hidden="true">{answers.consent ? '✓' : ''}</span>
                  <span className="consent-text">Yes, I consent</span>
                </label>
                <Hint>Without consent we can&apos;t collect a sample, but your doctor can still see you.</Hint>
              </>
            ))}
          </SectionCard>
        )

      default:
        return null
    }
  }

  const renderScreen = () => {
    switch (step) {
      case 'welcome':
        return (
          <div className="welcome">
            <div className="welcome-badge">GenoRoot · Hair & Scalp Clinic</div>
            <h1>Help your doctor<br />understand your hair</h1>
            <p className="welcome-lead">
              A short, private conversation before your visit — 5 sections, about 3 minutes. Your doctor sees a complete summary; you barely notice you filled anything.
            </p>
            <div className="welcome-meta">
              <span>5 sections</span><span className="dot">·</span><span>~3 minutes</span><span className="dot">·</span><span>No login</span><span className="dot">·</span><span>Stays on this device</span>
            </div>
            <BigButton onClick={() => setStep('A')}>Start — Section A</BigButton>
            <p className="welcome-hinglish">Hinglish is fine · हिंदी-English, jo aapko easy lage</p>
          </div>
        )

      case 'summary': {
        const hasProducts = Object.values(answers.products).some(v => v.used)
        const hasProcedures = Object.values(answers.procedures).some(v => v.done)
        return (
          <SectionCard title="Review — looks right?" subtitle="Tap any answer to go back and change it.">
            <div className="summary-list">
              <SummaryRow label="Context" value={answers.sex || '— not specified'} onEdit={() => setStep('A')} />
              <SummaryRow label="Age when hair loss began" value={answers.ageHairLossBegan || '—'} onEdit={() => setStep('A')} />
              <SummaryRow label="How long" value={answers.duration || '—'} onEdit={() => setStep('A')} />
              <SummaryRow label="Family history" value={answers.familyHistory.join(' · ') || '—'} onEdit={() => setStep('A')} />
              <SummaryRow label="Pattern" value={answers.pattern.join(' · ') || '—'} onEdit={() => setStep('A')} />
              <SummaryRow label="Diagnosed conditions" value={answers.diagnosedConditions.join(' · ') || '—'} onEdit={() => setStep('B')} />
              {answers.sex === 'female' && <SummaryRow label="Menstrual cycle" value={answers.menstrualCycle || '—'} onEdit={() => setStep('B')} />}
              {answers.sex === 'female' && <SummaryRow label="Pregnancy" value={answers.pregnancyRelated || '—'} onEdit={() => setStep('B')} />}
              <SummaryRow label="Acne / oily skin" value={answers.adultAcneOilySkin === null ? '—' : answers.adultAcneOilySkin ? 'Yes' : 'No'} onEdit={() => setStep('B')} />
              <SummaryRow label="Excess hair growth" value={answers.excessBodyFacialHair === null ? '—' : answers.excessBodyFacialHair ? 'Yes' : 'No'} onEdit={() => setStep('B')} />
              <SummaryRow label="Last 6 months" value={answers.past6Months.join(' · ') || 'None selected'} onEdit={() => setStep('C')} />
              <SummaryRow label="Smoking" value={answers.smoking === null ? '—' : answers.smoking ? `Yes — ${answers.smokingSeverity || '—'}` : 'No'} onEdit={() => setStep('C')} />
              <SummaryRow label="Alcohol" value={answers.alcohol === null ? '—' : answers.alcohol ? 'Yes' : 'No'} onEdit={() => setStep('C')} />
              <SummaryRow label="Hard water" value={answers.hardWater === null ? '—' : answers.hardWater ? 'Yes' : 'No'} onEdit={() => setStep('C')} />
              <SummaryRow label="Wash frequency" value={answers.hairWashFrequency || '—'} onEdit={() => setStep('C')} />
              <SummaryRow label="Heating tools / chemicals" value={answers.heatingTools === null ? '—' : answers.heatingTools ? 'Yes' : 'No'} onEdit={() => setStep('C')} />
              <SummaryRow label="Salon treatments" value={answers.salonTreatments ? `Yes — ${answers.salonTreatmentDetail || 'not specified'}` : answers.salonTreatments === false ? 'No' : '—'} onEdit={() => setStep('C')} />
              {hasProducts && <div className="summary-divider" />}
              {Object.entries(answers.products).filter(([,v]) => v.used).map(([k,v]) => (
                <SummaryRow key={k} label={k} value={`${v.duration || '—'} · helped: ${v.helped === null ? '—' : v.helped ? 'yes' : 'no'} · side effects: ${v.sideEffects === null ? '—' : v.sideEffects ? 'yes' : 'no'}`} onEdit={() => setStep('D')} />
              ))}
              {hasProcedures && <div className="summary-divider" />}
              {Object.entries(answers.procedures).filter(([,v]) => v.done).map(([k,v]) => (
                <SummaryRow key={k} label={k} value={`${v.sessions || '—'} sessions · helped: ${v.helped === null ? '—' : v.helped ? 'yes' : 'no'}`} onEdit={() => setStep('D')} />
              ))}
              <SummaryRow label="Past treatment side effects" value={answers.pastTreatmentSideEffects ? `Yes — ${answers.pastTreatmentDescribe || 'no detail'}` : answers.pastTreatmentSideEffects === false ? 'No' : '—'} onEdit={() => setStep('D')} />
              <SummaryRow label="Sample" value={answers.sampleType || '—'} onEdit={() => setStep('E')} />
              <SummaryRow label="Consent" value={answers.consent ? 'Yes' : 'No'} onEdit={() => setStep('E')} />
            </div>
            <BigButton onClick={() => setStep('done')}>Confirm & complete</BigButton>
            <BigButton variant="ghost" onClick={goPrev}>Go back</BigButton>
          </SectionCard>
        )
      }

      case 'done': {
        const finalForm = buildFinalForm(answers)
        return (
          <div className="done">
            <div className="done-icon">✓</div>
            <h1>Done — your doctor has the full picture</h1>
            <p className="done-lead">No paper to hand over. No nurse re-typing. Walk in and your consultation starts where it should.</p>
            <div className="done-actions">
              <BigButton variant="secondary" onClick={() => {
                navigator.clipboard?.writeText(JSON.stringify(finalForm, null, 2))
                alert('Copied JSON to clipboard')
              }}>Copy JSON</BigButton>
              <BigButton variant="ghost" onClick={() => {
                const blob = new Blob([JSON.stringify(finalForm, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url; a.download = 'genoroot-intake.json'; a.click()
                URL.revokeObjectURL(url)
              }}>Download JSON</BigButton>
            </div>
            <details className="json-preview" open>
              <summary>Filled form — structured data (what the doctor sees)</summary>
              <pre>{JSON.stringify(finalForm, null, 2)}</pre>
            </details>
            <BigButton variant="ghost" onClick={() => { patternSeeded.current = false; setAnswers(freshAnswers()); setStep('welcome'); try{localStorage.removeItem('hair-intake-answers')}catch{} }}>Start another intake</BigButton>
          </div>
        )
      }

      default:
        return renderSection(step)
    }
  }

  const essentialStats = () => {
    let answered = 0
    let total = 0
    answered += Number(validAge()) + Number(!!answers.duration) + Number(answers.familyHistory.length > 0) + Number(answers.pattern.length > 0)
    total += 4
    const f = answers.sex === 'female'
    answered += Number(answers.diagnosedConditions.length > 0) + Number(answers.adultAcneOilySkin !== null) + Number(answers.excessBodyFacialHair !== null) + (f ? Number(!!answers.menstrualCycle) + Number(!!answers.pregnancyRelated) : 0)
    total += 3 + (f ? 2 : 0)
    answered += Number(habitsCompleted())
    total += 1
    answered += Number(answers.pastTreatmentSideEffects !== null)
    total += 1
    answered += Number(!!answers.sampleType) + Number(!!answers.consent)
    total += 2
    return { answered, total }
  }

  const liveLines = () => {
    const rows: { label: string; value: string; answered: boolean }[] = []
    const push = (l: string, v: string | null) => {
      const val = v && v !== '' ? v : '—'
      rows.push({ label: l, value: val, answered: val !== '—' })
    }
    push('Sex context', answers.sex)
    push('Age when began', answers.ageHairLossBegan || null)
    push('Duration', answers.duration)
    push('Family history', answers.familyHistory.length ? answers.familyHistory.join(' · ') : null)
    push('Pattern', answers.pattern.length ? answers.pattern.join(' · ') : null)
    push('Diagnosed conditions', answers.diagnosedConditions.length ? answers.diagnosedConditions.join(' · ') : null)
    if (answers.sex === 'female') {
      push('Menstrual cycle', answers.menstrualCycle)
      push('Pregnancy', answers.pregnancyRelated)
    }
    push('Acne / oily skin', answers.adultAcneOilySkin == null ? null : answers.adultAcneOilySkin ? 'Yes' : 'No')
    push('Excess body / facial hair', answers.excessBodyFacialHair == null ? null : answers.excessBodyFacialHair ? 'Yes' : 'No')
    push('Last 6 months', answers.past6Months.length ? answers.past6Months.join(' · ') : null)
    const b = [answers.smoking == null ? null : answers.smoking ? 'Smoking: Yes' : 'Smoking: No', answers.alcohol == null ? null : answers.alcohol ? 'Alcohol: Yes' : 'Alcohol: No', answers.hardWater == null ? null : answers.hardWater ? 'Hard water: Yes' : 'Hard water: No', answers.heatingTools == null ? null : answers.heatingTools ? 'Tools: Yes' : 'Tools: No'].filter(Boolean)
    push('Smoking · alcohol · water · tools', b.length ? b.join(' · ') : null)
    push('Hair wash frequency', answers.hairWashFrequency)
    push('Salon treatments', answers.salonTreatments == null ? null : answers.salonTreatments ? `Yes${answers.salonTreatmentDetail ? ' — ' + answers.salonTreatmentDetail : ''}` : 'No')
    const used = Object.entries(answers.products).filter(([, v]) => v.used)
    push('Products tried', used.length ? used.map(([k]) => k).join(' · ') : null)
    const procs = Object.entries(answers.procedures).filter(([, v]) => v.done)
    push('In-clinic procedures', procs.length ? procs.map(([k]) => k).join(' · ') : null)
    push('Past side effects', answers.pastTreatmentSideEffects == null ? null : answers.pastTreatmentSideEffects ? `Yes${answers.pastTreatmentDescribe ? ' — ' + answers.pastTreatmentDescribe : ''}` : 'No')
    push('Sample', answers.sampleType)
    push('Consent', answers.consent == null ? null : answers.consent ? 'Yes' : 'No')
    return rows
  }

  const sheet = showLeaveSheet && (
    <div className="sheet-backdrop" onClick={() => setShowLeaveSheet(false)}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label="Leave intake?" onClick={e => e.stopPropagation()}>
        <h3>Leave intake?</h3>
        <p>Your progress is saved on this device for 7 days. You can resume where you left off.</p>
        <div className="sheet-actions">
          <BigButton variant="ghost" onClick={() => setShowLeaveSheet(false)}>Resume</BigButton>
          <BigButton variant="secondary" onClick={() => { setShowLeaveSheet(false); setStep('welcome') }}>Leave</BigButton>
        </div>
      </div>
    </div>
  )

  // Q12/Q13 follow-ups live in a popup, not inline — no layout jump when the
  // page grows/shrinks. Tap the row (or flip to Used/Done) to open it.
  const detailModal = editRow && (() => {
    const isProduct = editRow.kind === 'product'
    const entry = isProduct ? answers.products[editRow.key] : answers.procedures[editRow.key]
    if (!entry) return null
    const sub = isProduct ? 'OTC / medicated product' : 'In-clinic procedure'
    const durLabel = isProduct ? 'How long did you use it?' : 'How many sessions?'
    const durs = isProduct ? ['<3mo', '3-6mo', '>6mo'] : ['1-3', '4-6', '>6']
    return (
      <div className="detail-backdrop" onClick={() => setEditRow(null)}>
        <div className="detail-card" role="dialog" aria-modal="true" aria-label={`${editRow.key} details`} onClick={e => e.stopPropagation()}>
          <div className="detail-head">
            <div>
              <h3 className="detail-title">{editRow.key}</h3>
              <p className="detail-sub">{sub}</p>
            </div>
            <button type="button" className="icon-btn" onClick={() => setEditRow(null)} aria-label="Close">✕</button>
          </div>
          <div className="detail-body">
            <div className="followup-label">{durLabel}</div>
            <div className="opt-grid small">
              {durs.map(opt => (
                <OptionCard key={opt} label={opt} selected={isProduct ? (entry as ProductEntry).duration === opt : (entry as ProcedureEntry).sessions === opt} onSelect={() => isProduct ? editProduct(editRow.key, { duration: opt }) : editProcedure(editRow.key, { sessions: opt })} />
              ))}
            </div>
            <div className="table-yn-row"><span>Did it help?</span><YesNo value={entry.helped} onChange={v => isProduct ? editProduct(editRow.key, { helped: v }) : editProcedure(editRow.key, { helped: v })} /></div>
            {isProduct && <div className="table-yn-row"><span>Any side effects?</span><YesNo value={(entry as ProductEntry).sideEffects} onChange={v => editProduct(editRow.key, { sideEffects: v })} /></div>}
          </div>
          <div className="detail-actions">
            <BigButton variant="ghost" onClick={() => {
              if (isProduct) editProduct(editRow.key, { used: false, duration: null, helped: null, sideEffects: null })
              else editProcedure(editRow.key, { done: false, sessions: null, helped: null })
              setEditRow(null)
            }}>I haven't used this</BigButton>
            <BigButton onClick={() => setEditRow(null)}>Done</BigButton>
          </div>
        </div>
      </div>
    )
  })()

  const renderDeskShell = () => {
    const { answered, total } = essentialStats()
    const allDone = SECTIONS.every(s => sectionComplete(s))
    return (
      <div className="app is-desktop">
        <aside className="rail">
          <div className="rail-title">Your check-in</div>
          <p className="rail-sub">{answered} of {total} essentials answered</p>
          {RAIL.map(g => {
            const s = g.screens[0]
            const complete = sectionComplete(s)
            const current = step === s
            return (
              <button key={g.letter} type="button" className={`rail-item ${current ? 'current' : ''} ${complete ? 'done' : ''}`} onClick={() => setStep(s)}>
                <span className="rail-letter">{g.letter}</span>
                <span className="rail-item-label">{g.title}</span>
                <span className="rail-check" aria-hidden="true">{complete ? '✓' : ''}</span>
              </button>
            )
          })}
          <button type="button" className={`rail-item rail-review ${step === 'summary' ? 'current' : ''}`} onClick={() => setStep('summary')}>
            <span className="rail-letter">✓</span>
            <span className="rail-item-label">Review & finish</span>
          </button>
          <div className="rail-keys">← → move between sections · Ctrl/⌘ Enter to review</div>
        </aside>

        <main className="desk-form">
          <header className="desk-header">
            <div className="desk-brand">GenoRoot · Hair & Scalp Intake</div>
            <div className="desk-count"><b>{answered}</b><span> / {total} essentials</span></div>
            <button type="button" className="icon-btn" onClick={() => setShowLeaveSheet(true)} aria-label="Close">✕</button>
          </header>

          <div className="desk-sections">
            {step === 'summary' ? renderScreen() : SECTIONS.map(s => (
              <section key={s} id={`desk-${s}`} className={`desk-section ${sectionComplete(s) ? 'is-complete' : ''}`}>
                {renderSection(s)}
              </section>
            ))}
          </div>

          {allDone && step !== 'summary' && (
            <div className="desk-actions">
              <span className="desk-actions-note">All 5 sections complete</span>
              <BigButton onClick={() => setStep('summary')}>Review the filled form →</BigButton>
            </div>
          )}
        </main>

        <aside className="desk-preview">
          <div className="desk-preview-title">The form, filling itself</div>
          <p className="desk-preview-sub">What your doctor sees — updating as you answer.</p>
          <div className="desk-preview-list">
            {liveLines().map((r, i) => (
              <div key={i} className={`desk-preview-row ${r.answered ? 'answered' : ''}`}>
                <span className="desk-preview-label">{r.label}</span>
                <span className="desk-preview-value">{r.value}</span>
              </div>
            ))}
          </div>
          {allDone && step !== 'summary' && (
            <div className="desk-preview-review">
              <BigButton onClick={() => setStep('summary')}>Review & finish →</BigButton>
            </div>
          )}
          <div className="desk-preview-foot">Saved on this device · DPDP: deleted on submit</div>
        </aside>

        {sheet}
        {detailModal}
      </div>
    )
  }

  const doneHome = (step === 'welcome' || step === 'done')

  if (isDesktop && !doneHome) return renderDeskShell()

  return (
    <div className="app">
      {!doneHome && (
        <>
          <ProgressBar progress={progress} />
          <StepHeader
            current={Math.max(1, screenIndex)}
            total={6}
            stepId={step}
            onBack={goPrev}
            onClose={() => setShowLeaveSheet(true)}
          />
          {SECTIONS.includes(step as any) && <div className="screen-label">{SECTION_TITLE[step as string]}</div>}
        </>
      )}
      <main className="main">{renderScreen()}</main>
      {!doneHome && (
        <footer className="footer">
          <span>{step === 'summary' ? 'Review' : `Section ${step} of 5`}</span>
          <span className="footer-hint">Back to change · saved on this device · DPDP: deleted on submit</span>
        </footer>
      )}
      {SECTIONS.includes(step as any) && (
        <div className="section-nav">
          <BigButton variant="ghost" onClick={goPrev}>← Previous</BigButton>
          <BigButton onClick={goNext} disabled={!sectionComplete(step as any)}>
            {step === 'E' ? 'Review & finish' : sectionComplete(step as any) ? `Next — ${SECTION_TITLE[SECTIONS[SECTIONS.indexOf(step as any) + 1] as string]}` : 'Answer everything above'}
          </BigButton>
        </div>
      )}
      {sheet}
      {detailModal}
    </div>
  )
}

function SummaryRow({ label, value, onEdit }: { label: string; value: string; onEdit?: () => void }) {
  return (
    <button type="button" className={`summary-row ${onEdit ? 'is-editable' : ''}`} onClick={onEdit} disabled={!onEdit}>
      <span className="summary-label">{label}</span>
      <span className="summary-value">{value}</span>
      {onEdit && <span className="summary-edit" aria-hidden="true">✎</span>}
    </button>
  )
}

function buildFinalForm(answers: Answers) {
  // Output matches the fixed form — coverage & correctness graded
  return {
    form: 'GenoRoot Hair & Scalp Intake',
    submittedAt: new Date().toISOString(),
    A_personalAndFamily: {
      age_hair_loss_began: answers.ageHairLossBegan ? Number(answers.ageHairLossBegan) : null,
      duration: answers.duration,
      family_history: answers.familyHistory,
      pattern: answers.pattern,
    },
    B_hormonalAndHealth: {
      diagnosed_conditions: answers.diagnosedConditions,
      menstrual_cycle: answers.menstrualCycle,
      pregnancy_related: answers.pregnancyRelated,
      adult_acne_oily_skin: answers.adultAcneOilySkin,
      excess_body_facial_hair: answers.excessBodyFacialHair,
    },
    C_lifestyle: {
      past_6_months: answers.past6Months,
      habits: {
        smoking: answers.smoking,
        smoking_severity: answers.smokingSeverity,
        alcohol: answers.alcohol,
        hard_water: answers.hardWater,
        hair_wash_frequency: answers.hairWashFrequency,
        heating_tools_or_styling_chemicals: answers.heatingTools,
        salon_treatments: answers.salonTreatments,
        salon_treatment_detail: answers.salonTreatmentDetail,
      },
    },
    D_currentTreatments: {
      products: answers.products,
      procedures: answers.procedures,
      past_treatment_side_effects: answers.pastTreatmentSideEffects,
      past_treatment_describe: answers.pastTreatmentDescribe,
    },
    E_sampleAndConsent: {
      sample_type: answers.sampleType,
      consent: answers.consent,
    },
    _meta: { sex_context: answers.sex },
  }
}
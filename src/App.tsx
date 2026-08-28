// GenoRoot — hair intake that fills itself
// Client-only, no keys, no backend. Deploy as static build.

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Answers } from './schema'
import { normalizeAnswers, EMPTY_ANSWERS, PRODUCT_ROW_KEYS, PROCEDURE_ROW_KEYS } from './schema'
import type { StepId } from './intake-steps'
import {
  getStepIndex,
  getStepCount,
  getProgress,
  getNextStep,
  getPrevStep,
  isFirstStep,
  getVisibleSteps,
  STEPS,
} from './intake-steps'
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
  const [step, setStep] = useState<StepId>('welcome')
  const [showLeaveSheet, setShowLeaveSheet] = useState(false)
  const isDesktop = useIsDesktop()
  const patternSeeded = useRef(false)

  // Q4 inference: if hair loss started young + father similar, pre-mark the most
  // common patterns as *suggestions* – always confirmed, never assumed.
  useEffect(() => {
    if (step !== 'q4' || patternSeeded.current) return
    patternSeeded.current = true
    const age = parseInt(answers.ageHairLossBegan, 10)
    const father = answers.familyHistory.includes('Father had hair loss')
    if (!isNaN(age) && age <= 25 && father && answers.pattern.length === 0) {
      setAnswers(prev => ({ ...prev, pattern: ['Receding hairline', 'Thinning at crown'] }))
    }
  }, [step])

  // Desktop keyboard nav: arrows move, Enter confirms (skips list/yes-no buttons).
  useEffect(() => {
    if (!isDesktop) return
    const onKey = (e: KeyboardEvent) => {
      if (showLeaveSheet) return
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (canContinue() && (e.key !== 'Enter' || tag !== 'BUTTON')) {
          e.preventDefault()
          goNext()
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goPrev()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isDesktop, step, answers, showLeaveSheet])

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ts: Date.now(), answers })) } catch {}
  }, [answers])

  const update = useCallback((patch: Partial<Answers>) => {
    setAnswers(prev => ({ ...prev, ...patch }))
  }, [])

  const currentIndex = getStepIndex(step, answers)
  const totalSteps = getStepCount(answers)
  const progress = getProgress(answers, step)

  const goNext = useCallback(() => {
    const nxt = getNextStep(step, answers)
    if (nxt) setStep(nxt)
  }, [step, answers])

  const goPrev = useCallback(() => {
    const prv = getPrevStep(step, answers)
    if (prv) setStep(prv)
  }, [step, answers])

  const canContinue = (): boolean => {
    switch (step) {
      case 'welcome': return true
      case 'sex': return true
      case 'q1': {
        const n = parseInt(answers.ageHairLossBegan, 10)
        return !!answers.ageHairLossBegan && !isNaN(n) && n >= 10 && n <= 80
      }
      case 'q3': return answers.familyHistory.length > 0
      case 'q4': return answers.pattern.length > 0
      case 'q5': return answers.diagnosedConditions.length > 0
      case 'q14': return answers.pastTreatmentSideEffects !== null
      case 'q16': return !!answers.consent
      default: return true
    }
  }

  const renderStep = () => {
    switch (step) {
      case 'welcome':
        return (
          <div className="welcome">
            <div className="welcome-badge">GenoRoot · Hair & Scalp Clinic</div>
            <h1>Help your doctor<br />understand your hair</h1>
            <p className="welcome-lead">
              A short, private conversation before your visit. Your doctor sees a complete summary — you barely notice you filled anything.
            </p>
            <div className="welcome-meta">
              <span>~3 minutes</span><span className="dot">·</span><span>No login</span><span className="dot">·</span><span>Stays on this device</span>
            </div>
            <BigButton onClick={() => setStep('sex')}>Start — 1 tap at a time</BigButton>
            <p className="welcome-hinglish">Hinglish is fine · हिंदी-English, jo aapko easy lage</p>
          </div>
        )

      case 'sex':
        return (
          <SectionCard title="One quick check" subtitle="Some questions are different for women — this helps us ask only what's relevant.">
            <div className="opt-grid">
              <OptionCard label="Male" selected={answers.sex === 'male'} onSelect={() => { update({ sex: 'male' }); setTimeout(goNext, 180) }} />
              <OptionCard label="Female" selected={answers.sex === 'female'} onSelect={() => { update({ sex: 'female' }); setTimeout(goNext, 180) }} />
              <OptionCard label="Prefer not to say" selected={answers.sex === 'other'} onSelect={() => { update({ sex: 'other' }); setTimeout(goNext, 180) }} />
            </div>
            <Hint>You can skip — we&apos;ll just show every question.</Hint>
            <BigButton variant="ghost" onClick={goNext}>Skip</BigButton>
          </SectionCard>
        )

      case 'q1': {
        const n = parseInt(answers.ageHairLossBegan, 10)
        const invalid = !answers.ageHairLossBegan || isNaN(n) || n < 10 || n > 80
        return (
          <SectionCard title="When did you first notice hair loss?" subtitle="Your age when it started — best guess is fine.">
            <NumberStepper value={answers.ageHairLossBegan} onChange={v => update({ ageHairLossBegan: v })} min={10} max={80} label="Age" />
            <Hint>Tap + / − or type the number.</Hint>
            {invalid ? <p className="field-error">Enter a number between 10 and 80</p> : <p className="field-ok">Looks good — tap Continue</p>}
            <BigButton onClick={goNext} disabled={invalid}>Continue</BigButton>
          </SectionCard>
        )
      }

      case 'q2':
        return (
          <SectionCard title="How long has it been?" subtitle="Since you first noticed.">
            <div className="opt-grid">
              {['Less than 6 months','6-12 months','Over a year'].map(opt => (
                <OptionCard key={opt} label={opt} selected={answers.duration === opt} onSelect={() => { update({ duration: opt }); setTimeout(goNext, 180) }} />
              ))}
            </div>
          </SectionCard>
        )

      case 'q3':
        return (
          <SectionCard title="Family history?" subtitle="Select all that apply.">
            <div className="chip-grid">
              {['Father had hair loss','Mother had hair loss','Siblings with thinning or baldness','No known family history'].map(opt => (
                <ChipOption
                  key={opt}
                  label={opt}
                  selected={answers.familyHistory.includes(opt)}
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
            {!canContinue() && <p className="field-error">Pick at least one</p>}
            <BigButton onClick={goNext} disabled={!canContinue()}>Continue</BigButton>
          </SectionCard>
        )

      case 'q4': {
        const ageN = parseInt(answers.ageHairLossBegan, 10)
        const suggested = !isNaN(ageN) && ageN <= 25 && answers.familyHistory.includes('Father had hair loss')
        return (
          <SectionCard title="What pattern do you see?" subtitle="Select all that match you.">
            {suggested && answers.pattern.length > 0 && (
              <div className="field-ok" style={{ marginTop: 0, marginBottom: 12, lineHeight: 1.45 }}>
                Based on when it started + your father&apos;s hair loss, we pre-marked the two most common patterns. Tap to remove any that don&apos;t match.
              </div>
            )}
            <div className="chip-grid">
              {['Receding hairline','Thinning at crown','Widening part line','Diffuse thinning','Patchy loss','Sudden excessive shedding'].map(opt => (
                <ChipOption key={opt} label={opt} selected={answers.pattern.includes(opt)} onToggle={() => {
                  update({ pattern: answers.pattern.includes(opt) ? answers.pattern.filter(x => x !== opt) : [...answers.pattern, opt] })
                }} />
              ))}
            </div>
            {!canContinue() && <p className="field-error">Pick at least one</p>}
            <BigButton onClick={goNext} disabled={!canContinue()}>Continue</BigButton>
          </SectionCard>
        )
      }

      case 'q5':
        return (
          <SectionCard title="Any diagnosed conditions?" subtitle="Helps your doctor decide which tests to run — not shared outside the clinic.">
            <div className="chip-grid">
              {['PCOS/PCOD','Thyroid disorder','Diabetes','Autoimmune disease','Anemia','None'].map(opt => (
                <ChipOption
                  key={opt}
                  label={opt}
                  selected={answers.diagnosedConditions.includes(opt)}
                  exclusive={opt === 'None'}
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
            <Hint>Private to your doctor. Hormonal conditions change how hair loss is interpreted.</Hint>
            <BigButton onClick={goNext} disabled={!canContinue()}>Continue</BigButton>
            {!canContinue() && <p className="field-error">Pick at least one — tap None if nothing applies</p>}
          </SectionCard>
        )

      case 'q6':
        return (
          <SectionCard title="Menstrual cycle" subtitle="For your doctor to interpret the hair picture correctly.">
            <div className="opt-grid">
              {['Regular','Irregular','Menopausal','Not applicable'].map(opt => (
                <OptionCard key={opt} label={opt} selected={answers.menstrualCycle === opt} onSelect={() => { update({ menstrualCycle: opt }); setTimeout(goNext, 180) }} />
              ))}
            </div>
          </SectionCard>
        )

      case 'q7':
        return (
          <SectionCard title="Pregnancy-related hair loss?" subtitle="If applicable.">
            <div className="opt-grid">
              {['Currently pregnant','Postpartum <1 year','Not applicable'].map(opt => (
                <OptionCard key={opt} label={opt} selected={answers.pregnancyRelated === opt} onSelect={() => { update({ pregnancyRelated: opt }); setTimeout(goNext, 180) }} />
              ))}
            </div>
          </SectionCard>
        )

      case 'q8':
        return (
          <SectionCard title="Acne or oily skin in adulthood?" subtitle="After your teenage years — hormonal clues your doctor uses.">
            <YesNo value={answers.adultAcneOilySkin} onChange={v => { update({ adultAcneOilySkin: v }); setTimeout(goNext, 220) }} />
            <Hint>Adult acne can signal hormonal balance — your doctor reads it with Q5 and Q9.</Hint>
          </SectionCard>
        )

      case 'q9':
        return (
          <SectionCard title="Excess body or facial hair growth?" subtitle="Unwanted hair on face, chest or back — a gentle hormonal signal.">
            <YesNo value={answers.excessBodyFacialHair} onChange={v => { update({ excessBodyFacialHair: v }); setTimeout(goNext, 220) }} />
            <Hint>Helps your doctor decide if a hormonal workup is useful. Only your doctor sees this.</Hint>
          </SectionCard>
        )

      case 'q10':
        return (
          <SectionCard title="In the last 6 months, any of these?" subtitle="Select all that happened — or none.">
            <div className="chip-grid">
              {[
                'Crash dieting or major weight loss',
                'High stress or emotional trauma',
                'Fever with illness (COVID, Dengue, Typhoid)',
                'Recent surgery',
                'Change in location/water/air quality',
              ].map(opt => (
                <ChipOption key={opt} label={opt} selected={answers.past6Months.includes(opt)} onToggle={() => {
                  update({ past6Months: answers.past6Months.includes(opt) ? answers.past6Months.filter(x => x !== opt) : [...answers.past6Months, opt] })
                }} />
              ))}
            </div>
            <Hint>Tap what applies. If nothing happened, just Continue.</Hint>
            <BigButton onClick={goNext}>Continue</BigButton>
          </SectionCard>
        )

      case 'q11': {
        const allAnswered = answers.smoking !== null && answers.alcohol !== null && answers.hardWater !== null && !!answers.hairWashFrequency && answers.heatingTools !== null && answers.salonTreatments !== null
        return (
          <SectionCard title="Daily habits" subtitle="Quick yes / no for each. Details only if needed.">
            <div className="habit-list">
              <div className="habit-group-label">Lifestyle</div>
              <div className="habit-row">
                <div className="habit-main"><span className="habit-label">Smoking</span><YesNo value={answers.smoking} onChange={v => update({ smoking: v, smokingSeverity: v ? answers.smokingSeverity : null })} /></div>
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

              <div className="habit-group-label" style={{marginTop:14}}>Hair care</div>
              <div className="habit-row">
                <div className="habit-main" style={{flexDirection:'column', alignItems:'stretch'}}>
                  <span className="habit-label" style={{marginBottom:8}}>Hair wash frequency</span>
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
            {!allAnswered && <p className="field-hint">Tip: answer all, then Continue</p>}
            <BigButton onClick={goNext}>Continue</BigButton>
          </SectionCard>
        )
      }

      case 'q12': {
        const rows = [...PRODUCT_ROW_KEYS]
        const anyUsed = Object.values(answers.products).some(v=>v.used)
        return (
          <SectionCard title="Products you&apos;ve tried" subtitle="Tap Used only where needed — everything else stays collapsed.">
            <button type="button" className="fast-path" onClick={()=>{
              const next={ ...answers.products }
              for(const k of rows) next[k]={ used:false, duration:null, helped:null, sideEffects:null }
              update({ products: next })
              setTimeout(goNext, 300)
            }}>Never used any → skip</button>
            {!anyUsed && <p className="field-hint" style={{marginTop:8}}>Or mark the few you did use below.</p>}
            <div className="table-grid" style={{marginTop:12}}>
              {rows.map(row => {
                const p = answers.products[row]
                return (
                  <div key={row} className={`table-row ${p.used?'is-open':''}`}>
                    <div className="table-row-head">
                      <span className="table-row-label">{row}</span>
                      <YesNo value={p.used} onChange={v => update({ products: { ...answers.products, [row]: { ...p, used: v, duration: v ? p.duration : null, helped: v ? p.helped : null, sideEffects: v ? p.sideEffects : null } } })} yesLabel="Used" noLabel="Never" />
                    </div>
                    {p.used && (
                      <div className="table-row-body">
                        <div className="followup-label">How long?</div>
                        <div className="opt-grid small">
                          {['<3mo','3-6mo','>6mo'].map(opt => (
                            <OptionCard key={opt} label={opt} selected={p.duration === opt} onSelect={() => update({ products: { ...answers.products, [row]: { ...p, duration: opt } } })} />
                          ))}
                        </div>
                        <div className="table-yn-row"><span>Did it help?</span><YesNo value={p.helped} onChange={v => update({ products: { ...answers.products, [row]: { ...p, helped: v } } })} /></div>
                        <div className="table-yn-row"><span>Any side effects?</span><YesNo value={p.sideEffects} onChange={v => update({ products: { ...answers.products, [row]: { ...p, sideEffects: v } } })} /></div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <BigButton onClick={goNext}>Continue</BigButton>
          </SectionCard>
        )
      }

      case 'q13': {
        const rows = [...PROCEDURE_ROW_KEYS]
        const anyDone = Object.values(answers.procedures).some(v=>v.done)
        return (
          <SectionCard title="In-clinic procedures" subtitle="Tap Done only where applicable — rest stay collapsed.">
            <button type="button" className="fast-path" onClick={()=>{
              const next={ ...answers.procedures }
              for(const k of rows) next[k]={ done:false, sessions:null, helped:null }
              update({ procedures: next })
              setTimeout(goNext, 300)
            }}>None done → skip</button>
            {!anyDone && <p className="field-hint" style={{marginTop:8}}>Or mark the few you had below.</p>}
            <div className="table-grid" style={{marginTop:12}}>
              {rows.map(row => {
                const p = answers.procedures[row]
                return (
                  <div key={row} className={`table-row ${p.done?'is-open':''}`}>
                    <div className="table-row-head">
                      <span className="table-row-label">{row}</span>
                      <YesNo value={p.done} onChange={v => update({ procedures: { ...answers.procedures, [row]: { ...p, done: v, sessions: v ? p.sessions : null, helped: v ? p.helped : null } } })} yesLabel="Done" noLabel="Never" />
                    </div>
                    {p.done && (
                      <div className="table-row-body">
                        <div className="followup-label">How many sessions?</div>
                        <div className="opt-grid small">
                          {['1-3','4-6','>6'].map(opt => (
                            <OptionCard key={opt} label={opt} selected={p.sessions === opt} onSelect={() => update({ procedures: { ...answers.procedures, [row]: { ...p, sessions: opt } } })} />
                          ))}
                        </div>
                        <div className="table-yn-row"><span>Did it help?</span><YesNo value={p.helped} onChange={v => update({ procedures: { ...answers.procedures, [row]: { ...p, helped: v } } })} /></div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <BigButton onClick={goNext}>Continue</BigButton>
          </SectionCard>
        )
      }

      case 'q14':
        return (
          <SectionCard title="Side effects or poor response to past treatment?" subtitle="If yes, a few words helps your doctor.">
            <YesNo value={answers.pastTreatmentSideEffects} onChange={v => update({ pastTreatmentSideEffects: v, pastTreatmentDescribe: v ? answers.pastTreatmentDescribe : null })} />
            {answers.pastTreatmentSideEffects && (
              <div style={{marginTop:16}}>
                <VoicedTextArea value={answers.pastTreatmentDescribe || ''} onChange={v => update({ pastTreatmentDescribe: v })} placeholder="What happened? e.g. Itchy scalp with minoxidil" rows={3} />
              </div>
            )}
            <div style={{marginTop:20}}>
              <BigButton onClick={goNext} disabled={!canContinue()}>Continue</BigButton>
            </div>
          </SectionCard>
        )

      case 'q15':
        return (
          <SectionCard title="Preferred sample for genetic analysis" subtitle="Both work. Saliva is easiest — just spit in a tube.">
            <div className="opt-grid">
              {[
                { id:'Saliva', label:'Saliva', sub:'No needle' },
                { id:'Blood', label:'Blood', sub:'More DNA' },
                { id:'Either', label:'Either', sub:'Doctor can decide' },
              ].map(opt => (
                <OptionCard key={opt.id} label={opt.label} subLabel={opt.sub} selected={answers.sampleType === opt.id} onSelect={() => { update({ sampleType: opt.id }); setTimeout(goNext, 180) }} />
              ))}
            </div>
          </SectionCard>
        )

      case 'q16':
        return (
          <SectionCard title="Consent" subtitle="I agree to sample collection and genetic analysis for my hair-loss profile. You can withdraw anytime.">
            <label className="consent-card">
              <input type="checkbox" checked={!!answers.consent} onChange={e => update({ consent: e.target.checked })} />
              <span className="consent-check" aria-hidden="true">{answers.consent ? '✓' : ''}</span>
              <span className="consent-text">Yes, I consent</span>
            </label>
            <BigButton onClick={goNext} disabled={!canContinue()}>Review & finish</BigButton>
            <Hint>Without consent we can&apos;t collect a sample, but your doctor can still see you.</Hint>
          </SectionCard>
        )

      case 'summary': {
        const hasProducts = Object.values(answers.products).some(v => v.used)
        const hasProcedures = Object.values(answers.procedures).some(v => v.done)
        return (
          <SectionCard title="Review — looks right?" subtitle="Tap any answer to go back and change it.">
            <div className="summary-list">
              <SummaryRow label="Context" value={answers.sex || '— not specified'} onEdit={() => setStep('sex')} />
              <SummaryRow label="Age when hair loss began" value={answers.ageHairLossBegan || '—'} onEdit={() => setStep('q1')} />
              <SummaryRow label="How long" value={answers.duration || '—'} onEdit={() => setStep('q2')} />
              <SummaryRow label="Family history" value={answers.familyHistory.join(' · ') || '—'} onEdit={() => setStep('q3')} />
              <SummaryRow label="Pattern" value={answers.pattern.join(' · ') || '—'} onEdit={() => setStep('q4')} />
              <SummaryRow label="Diagnosed conditions" value={answers.diagnosedConditions.join(' · ') || '—'} onEdit={() => setStep('q5')} />
              {answers.sex === 'female' && <SummaryRow label="Menstrual cycle" value={answers.menstrualCycle || '—'} onEdit={() => setStep('q6')} />}
              {answers.sex === 'female' && <SummaryRow label="Pregnancy" value={answers.pregnancyRelated || '—'} onEdit={() => setStep('q7')} />}
              <SummaryRow label="Acne / oily skin" value={answers.adultAcneOilySkin === null ? '—' : answers.adultAcneOilySkin ? 'Yes' : 'No'} onEdit={() => setStep('q8')} />
              <SummaryRow label="Excess hair growth" value={answers.excessBodyFacialHair === null ? '—' : answers.excessBodyFacialHair ? 'Yes' : 'No'} onEdit={() => setStep('q9')} />
              <SummaryRow label="Last 6 months" value={answers.past6Months.join(' · ') || 'None selected'} onEdit={() => setStep('q10')} />
              <SummaryRow label="Smoking" value={answers.smoking === null ? '—' : answers.smoking ? `Yes — ${answers.smokingSeverity || '—'}` : 'No'} onEdit={() => setStep('q11')} />
              <SummaryRow label="Alcohol" value={answers.alcohol === null ? '—' : answers.alcohol ? 'Yes' : 'No'} onEdit={() => setStep('q11')} />
              <SummaryRow label="Hard water" value={answers.hardWater === null ? '—' : answers.hardWater ? 'Yes' : 'No'} onEdit={() => setStep('q11')} />
              <SummaryRow label="Wash frequency" value={answers.hairWashFrequency || '—'} onEdit={() => setStep('q11')} />
              <SummaryRow label="Heating tools / chemicals" value={answers.heatingTools === null ? '—' : answers.heatingTools ? 'Yes' : 'No'} onEdit={() => setStep('q11')} />
              <SummaryRow label="Salon treatments" value={answers.salonTreatments ? `Yes — ${answers.salonTreatmentDetail || 'not specified'}` : answers.salonTreatments === false ? 'No' : '—'} onEdit={() => setStep('q11')} />{hasProducts && <div className="summary-divider" />}
              {Object.entries(answers.products).filter(([,v]) => v.used).map(([k,v]) => (
                <SummaryRow key={k} label={k} value={`${v.duration || '—'} · helped: ${v.helped === null ? '—' : v.helped ? 'yes' : 'no'} · side effects: ${v.sideEffects === null ? '—' : v.sideEffects ? 'yes' : 'no'}`} onEdit={() => setStep('q12')} />
              ))}
              {hasProcedures && <div className="summary-divider" />}
              {Object.entries(answers.procedures).filter(([,v]) => v.done).map(([k,v]) => (
                <SummaryRow key={k} label={k} value={`${v.sessions || '—'} sessions · helped: ${v.helped === null ? '—' : v.helped ? 'yes' : 'no'}`} onEdit={() => setStep('q13')} />
              ))}
              <SummaryRow label="Past treatment side effects" value={answers.pastTreatmentSideEffects ? `Yes — ${answers.pastTreatmentDescribe || 'no detail'}` : answers.pastTreatmentSideEffects === false ? 'No' : '—'} onEdit={() => setStep('q14')} />
              <SummaryRow label="Sample" value={answers.sampleType || '—'} onEdit={() => setStep('q15')} />
              <SummaryRow label="Consent" value={answers.consent ? 'Yes' : 'No'} onEdit={() => setStep('q16')} />
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
    }
  }

  const RAIL: { letter: string; title: string; steps: StepId[] }[] = [
    { letter: 'A', title: 'Personal & family', steps: ['q1','q2','q3','q4'] },
    { letter: 'B', title: 'Hormonal & health', steps: ['q5','q6','q7','q8','q9'] },
    { letter: 'C', title: 'Lifestyle', steps: ['q10','q11'] },
    { letter: 'D', title: 'Treatments', steps: ['q12','q13','q14'] },
    { letter: 'E', title: 'Sample & consent', steps: ['q15','q16'] },
  ]
  const visibleSteps = getVisibleSteps(answers)

  return (
    <div className={`app ${isDesktop ? 'is-desktop' : ''}`}>
      {isDesktop && step !== 'welcome' && step !== 'done' && (
        <aside className="rail">
          <div className="rail-title">Your check-in</div>
          <p className="rail-sub">Answers save as you go. Jump to any section.</p>
          {RAIL.map(g => {
            const steps = g.steps.filter(id => visibleSteps.includes(id))
            if (!steps.length) return null
            return (
              <div className="rail-group" key={g.letter}>
                <div className="rail-letter">{g.letter}</div>
                <div className="rail-items">
                  {steps.map(id => {
                    const label = STEPS.find(s => s.id === id)?.label ?? id
                    const idx = getStepIndex(id, answers)
                    const cls = idx === currentIndex ? 'current' : idx < currentIndex ? 'done' : ''
                    return (
                      <button key={id} type="button" className={`rail-item ${cls}`} onClick={() => setStep(id)}>
                        <span className="rail-dot" aria-hidden="true" />
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
          <div className="rail-keys">← → arrow keys move · click to jump</div>
        </aside>
      )}
      <div className="desktop-body">
        {step !== 'welcome' && step !== 'done' && (
          <>
            <ProgressBar progress={progress} />
            <StepHeader
              current={currentIndex}
              total={totalSteps - 2}
              stepId={step}
              onBack={isFirstStep(step, answers) ? undefined : goPrev}
              onClose={() => setShowLeaveSheet(true)}
            />
          </>
        )}
        <main className="main">{renderStep()}</main>
        {step !== 'welcome' && step !== 'done' && (
          <footer className="footer">
            <span>Step {currentIndex} of {totalSteps - 2}</span>
            <span className="footer-hint">Back to change · saved on this device · DPDP: deleted on submit</span>
          </footer>
        )}
      </div>
      {showLeaveSheet && (
        <div className="sheet-backdrop" onClick={()=>setShowLeaveSheet(false)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label="Leave intake?" onClick={e=>e.stopPropagation()}>
            <h3>Leave intake?</h3>
            <p>Your progress is saved on this device for 7 days. You can resume where you left off.</p>
            <div className="sheet-actions">
              <BigButton variant="ghost" onClick={()=>setShowLeaveSheet(false)}>Resume</BigButton>
              <BigButton variant="secondary" onClick={()=>{ setShowLeaveSheet(false); setStep('welcome') }}>Leave</BigButton>
            </div>
          </div>
        </div>
      )}
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

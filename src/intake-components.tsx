// Input components — each one tuned to the question type.
// Big tap targets, mobile-first, accessible.

import { useState, useEffect } from 'react'
import type { ChangeEvent } from 'react'

export function BigButton({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  className = '',
}: {
  children: React.ReactNode
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  disabled?: boolean
  className?: string
}) {
  const base = 'btn btn-big'
  const vars = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
  }
  return (
    <button
      className={`${base} ${vars[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  )
}

export function OptionCard({
  label,
  selected,
  onSelect,
  subLabel,
  disabled = false,
}: {
  label: string
  selected: boolean
  onSelect: () => void
  subLabel?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      className={`opt-card ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={disabled ? undefined : onSelect}
      disabled={disabled}
    >
      <div className="opt-main">{label}</div>
      {subLabel && <div className="opt-sub">{subLabel}</div>}
      {selected && <span className="opt-check" aria-hidden="true">✓</span>}
    </button>
  )
}

export function ChipOption({
  label,
  selected,
  onToggle,
  exclusive = false,
}: {
  label: string
  selected: boolean
  onToggle: () => void
  exclusive?: boolean
}) {
  return (
    <button
      type="button"
      className={`chip-opt ${selected ? 'selected' : ''} ${exclusive ? 'exclusive' : ''}`}
      onClick={onToggle}
    >
      {label}
      {selected && <span className="chip-check" aria-hidden="true">✓</span>}
    </button>
  )
}

export function YesNo({
  value,
  onChange,
  yesLabel = 'Yes',
  noLabel = 'No',
}: {
  value: boolean | null
  onChange: (v: boolean) => void
  yesLabel?: string
  noLabel?: string
}) {
  return (
    <div className="yesno">
      <button
        type="button"
        className={`yn-btn ${value === true ? 'selected' : ''}`}
        onClick={() => onChange(true)}
      >
        {yesLabel}
      </button>
      <button
        type="button"
        className={`yn-btn ${value === false ? 'selected' : ''}`}
        onClick={() => onChange(false)}
      >
        {noLabel}
      </button>
    </div>
  )
}

export function NumberStepper({
  value,
  onChange,
  min = 1,
  max = 100,
  label,
}: {
  value: string
  onChange: (v: string) => void
  min?: number
  max?: number
  label?: string
}) {
  const [local, setLocal] = useState(value)
  useEffect(()=>{ setLocal(value) }, [value])
  const num = parseInt(local, 10)
  const inc = () => {
    const n = isNaN(num) ? min : Math.min(max, num + 1)
    setLocal(String(n))
    onChange(String(n))
  }
  const dec = () => {
    const n = isNaN(num) ? min : Math.max(min, num - 1)
    setLocal(String(n))
    onChange(String(n))
  }
  const onInput = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    if (/^\d*$/.test(v)) {
      setLocal(v)
      onChange(v)
    }
  }
  return (
    <div className="stepper">
      {label && <div className="stepper-label">{label}</div>}
      <div className="stepper-row">
        <button type="button" className="stepper-btn" onClick={dec} aria-label="Decrease">−</button>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={local}
          onChange={onInput}
          className="stepper-input"
          aria-label={label || 'Number'}
        />
        <button type="button" className="stepper-btn" onClick={inc} aria-label="Increase">+</button>
      </div>
    </div>
  )
}

export function VoiceInput({
  listening,
  onToggle,
}: {
  listening: boolean
  onToggle: () => void
}) {
  const [supported, setSupported] = useState(false)
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) setSupported(true)
  }, [])
  if (!supported) return null
  return (
    <button
      type="button"
      className={`voice-btn ${listening ? 'listening' : ''}`}
      onClick={onToggle}
      aria-label={listening ? 'Stop listening' : 'Tap to speak'}
    >
      <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14.1 6.7 11H5.1c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.6z" fill="currentColor" />
      </svg>
      {listening ? 'Listening…' : 'Speak'}
    </button>
  )
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="txt-area"
    />
  )
}

export function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="progress-wrap" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
      <div className="progress-bar" style={{ width: `${progress}%` }} />
    </div>
  )
}

export function StepHeader({ current, total, onBack, onClose }: {
  current: number
  total: number
  stepId?: string
  onBack?: () => void
  onClose?: () => void
}) {
  return (
    <header className="step-header">
      {onBack && (
        <button type="button" className="icon-btn" onClick={onBack} aria-label="Back">
          <svg viewBox="0 0 24 24" width="24" height="24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor"/></svg>
        </button>
      )}
      <div className="step-counter">
        <span className="step-num">{current}</span> <span className="step-div">of</span> <span className="step-total">{total}</span>
      </div>
      {onClose && (
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" width="24" height="24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/></svg>
        </button>
      )}
    </header>
  )
}

export function SectionCard({ title, subtitle, children }: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section className="section-card">
      <div className="section-head">
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="section-sub">{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

export function Hint({ children }: { children: React.ReactNode }) {
  return <p className="hint">{children}</p>
}
// Input components — each one tuned to the question type.
// Big tap targets, mobile-first, accessible. Motion-enhanced.

import React, { useState, useEffect, useRef, useCallback } from 'react'
import type { ChangeEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Spring configs for consistent feel
const spring = { type: 'spring', stiffness: 320, damping: 24 } as const
const springQuick = { type: 'spring', stiffness: 420, damping: 28 } as const
const springSoft = { type: 'spring', stiffness: 260, damping: 22 } as const

// Question block animation variants
const questionVariants = {
  initial: { opacity: 0, y: 16 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const } },
}

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
    <motion.button
      className={`${base} ${vars[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      type="button"
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      whileHover={{ scale: disabled ? 1 : 1.01 }}
      transition={springQuick}
      style={{ opacity: disabled ? 0.45 : 1 }}
    >
      {children}
    </motion.button>
  )
}

export function OptionCard({
  label,
  selected,
  onSelect,
  subLabel,
  disabled = false,
  validationState = 'idle',
}: {
  label: string
  selected: boolean
  onSelect: () => void
  subLabel?: string
  disabled?: boolean
  validationState?: 'idle' | 'valid' | 'invalid'
}) {
  const isInvalid = validationState === 'invalid'
  return (
    <motion.button
      type="button"
      className={`opt-card ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={disabled ? undefined : onSelect}
      disabled={disabled}
      data-invalid={isInvalid || undefined}
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: disabled ? 1 : 1.015, boxShadow: '0 8px 30px rgba(26,26,26,.12)' }}
      animate={{
        borderColor: isInvalid ? 'var(--danger)' : selected ? 'var(--accent)' : 'var(--line)',
        background: selected ? 'var(--accent-soft)' : 'var(--card)',
        boxShadow: isInvalid ? '0 0 0 3px rgba(180,35,24,.14)' : selected ? '0 0 0 3px rgba(192,19,43,.10)' : 'none',
      }}
      transition={spring}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <div className="opt-text">
        <div className="opt-main">{label}</div>
        {subLabel && <div className="opt-sub">{subLabel}</div>}
      </div>
      {/* Always in the layout, only faded — selecting must not resize the card. */}
      <motion.span
        className="opt-check"
        aria-hidden="true"
        animate={{ opacity: selected ? 1 : 0, scale: selected ? 1 : 0.5 }}
        transition={springQuick}
      >
        ✓
      </motion.span>
    </motion.button>
  )
}

export function ChipOption({
  label,
  selected,
  onToggle,
  exclusive = false,
  validationState = 'idle',
}: {
  label: string
  selected: boolean
  onToggle: () => void
  exclusive?: boolean
  validationState?: 'idle' | 'valid' | 'invalid'
}) {
  const isInvalid = validationState === 'invalid'
  return (
    <motion.button
      type="button"
      className={`chip-opt ${selected ? 'selected' : ''} ${exclusive ? 'exclusive' : ''}`}
      onClick={onToggle}
      data-invalid={isInvalid || undefined}
      whileTap={{ scale: 0.95 }}
      animate={{
        background: selected ? (exclusive ? 'var(--text)' : 'var(--chip-on-bg)') : 'var(--chip-bg)',
        color: selected ? (exclusive ? 'white' : 'var(--chip-on)') : 'var(--text-2)',
        borderColor: isInvalid ? 'var(--danger)' : selected ? (exclusive ? 'var(--text)' : 'var(--accent-line)') : 'var(--line)',
        boxShadow: isInvalid ? '0 0 0 3px rgba(180,35,24,.14)' : selected ? '0 0 0 3px rgba(192,19,43,.10)' : 'none',
      }}
      transition={spring}
    >
      {label}
      {/* Always rendered, only faded: a chip must not change width when tapped,
          or the whole group reflows under the user's finger. */}
      <motion.span
        className="chip-check"
        aria-hidden="true"
        animate={{ opacity: selected ? 1 : 0, scale: selected ? 1 : 0.6 }}
        transition={springQuick}
      >
        ✓
      </motion.span>
    </motion.button>
  )
}

export function YesNo({
  value,
  onChange,
  yesLabel = 'Yes',
  noLabel = 'No',
  validationState = 'idle',
}: {
  value: boolean | null
  onChange: (v: boolean) => void
  yesLabel?: string
  noLabel?: string
  validationState?: 'idle' | 'valid' | 'invalid'
}) {
  const isInvalid = validationState === 'invalid'
  return (
    <div className="yesno" data-invalid={isInvalid || undefined}>
      <motion.button
        type="button"
        className="yn-btn"
        onClick={() => onChange(true)}
        whileTap={{ scale: 0.97 }}
        animate={{
          background: value === true ? 'var(--accent)' : isInvalid ? 'var(--bg-soft)' : 'var(--card)',
          color: value === true ? 'white' : 'var(--text-2)',
          borderColor: value === true ? 'var(--accent)' : isInvalid ? 'var(--danger)' : 'var(--line)',
          boxShadow: isInvalid ? '0 0 0 3px rgba(180,35,24,.14)' : value === true ? '0 0 0 3px rgba(192,19,43,.10)' : 'none',
        }}
        transition={spring}
      >
        {yesLabel}
      </motion.button>
      <motion.button
        type="button"
        className="yn-btn"
        onClick={() => onChange(false)}
        whileTap={{ scale: 0.97 }}
        animate={{
          background: value === false ? 'var(--accent)' : isInvalid ? 'var(--bg-soft)' : 'var(--card)',
          color: value === false ? 'white' : 'var(--text-2)',
          borderColor: value === false ? 'var(--accent)' : isInvalid ? 'var(--danger)' : 'var(--line)',
          boxShadow: isInvalid ? '0 0 0 3px rgba(180,35,24,.14)' : value === false ? '0 0 0 3px rgba(192,19,43,.10)' : 'none',
        }}
        transition={spring}
      >
        {noLabel}
      </motion.button>
      {isInvalid && (
        <motion.p
          className="field-error"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          Please select one
        </motion.p>
      )}
    </div>
  )
}

export function NumberStepper({
  value,
  onChange,
  min = 1,
  max = 100,
  startAt,
  label,
  autoComplete = 'off',
  validationState = 'idle',
  validationMessage,
}: {
  value: string
  onChange: (v: string) => void
  min?: number
  max?: number
  /** Where the steppers begin from an empty field — the typical answer,
      not the floor. Tapping + shouldn't propose the youngest age possible. */
  startAt?: number
  label?: string
  autoComplete?: string
  validationState?: 'idle' | 'valid' | 'invalid'
  validationMessage?: string
}) {
  const [local, setLocal] = useState(value)
  useEffect(() => { setLocal(value) }, [value])
  const num = parseInt(local, 10)
  const from = startAt ?? min
  const inc = () => {
    const n = isNaN(num) ? from : Math.min(max, num + 1)
    setLocal(String(n))
    onChange(String(n))
  }
  const dec = () => {
    const n = isNaN(num) ? from : Math.max(min, num - 1)
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
  const isValid = validationState === 'valid'
  const isInvalid = validationState === 'invalid'
  return (
    <div className="stepper">
      {label && <div className="stepper-label">{label}</div>}
      <div className="stepper-row">
        <motion.button
          type="button"
          className="stepper-btn"
          onClick={dec}
          aria-label="Decrease"
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.1 }}
        >
          −
        </motion.button>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={local}
          onChange={onInput}
          className="stepper-input"
          aria-label={label || 'Number'}
          autoComplete={autoComplete}
          aria-invalid={isInvalid}
          data-invalid={isInvalid || undefined}
          aria-describedby={isInvalid ? `${label}-error` : undefined}
          style={{
            borderColor: isValid ? 'var(--accent)' : isInvalid ? 'var(--danger)' : 'var(--line)',
            boxShadow: isValid ? '0 0 0 3px rgba(192,19,43,.12)' : isInvalid ? '0 0 0 3px rgba(180,35,24,.14)' : 'none',
          }}
        />
        <motion.button
          type="button"
          className="stepper-btn"
          onClick={inc}
          aria-label="Increase"
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.1 }}
        >
          +
        </motion.button>
      </div>
      {isInvalid && validationMessage && (
        <motion.p
          id={`${label}-error`}
          className="field-error"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {validationMessage}
        </motion.p>
      )}
    </div>
  )
}

export function useVoice(lang = 'en-IN') {
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const recRef = useRef<{ start: () => void; stop: () => void; abort: () => void } | null>(null)
  const commitRef = useRef<(transcript: string) => void>(() => {})

  useEffect(() => {
    const w = window as any
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!SR) return
    const rec = new SR()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = lang
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    rec.onresult = (e: any) => {
      const final: string[] = []
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final.push(e.results[i][0].transcript)
      }
      final.forEach(t => commitRef.current(t))
    }
    recRef.current = rec
    setSupported(true)
    return () => { try { rec.abort() } catch {} }
  }, [lang])

  const toggle = useCallback((onFinal: (t: string) => void) => {
    const rec = recRef.current
    if (!rec) return
    if (listening) { try { rec.stop() } catch {} setListening(false); return }
    commitRef.current = onFinal
    try { rec.start(); setListening(true) } catch { setListening(false) }
  }, [listening])

  return { supported, listening, toggle }
}

export function VoicedTextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
  invalid = false,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
  invalid?: boolean
}) {
  const { supported, listening, toggle } = useVoice()
  const commit = useCallback((t: string) => {
    const tx = t.trim()
    if (!tx) return
    onChange(value ? `${value.replace(/\s+$/, '')} ${tx}` : tx)
  }, [value, onChange])
  return (
    <div className="voiced-wrap">
      <TextArea value={value} onChange={onChange} placeholder={placeholder} rows={rows} invalid={invalid} />
      <div className="voiced-bar">
        {supported ? (
          <motion.button
            type="button"
            className={`voice-btn ${listening ? 'listening' : ''}`}
            onClick={() => toggle(commit)}
            aria-label={listening ? 'Stop listening' : 'Tap to speak'}
            whileTap={{ scale: 0.97 }}
            animate={{
              background: listening ? 'var(--accent)' : 'var(--accent-soft)',
              color: listening ? 'white' : 'var(--accent)',
              borderColor: listening ? 'var(--accent)' : 'var(--accent-line)',
            }}
            transition={spring}
          >
            <motion.svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              aria-hidden="true"
              animate={{ rotate: listening ? 360 : 0 }}
              transition={{ duration: listening ? 2 : 0, ease: 'linear', repeat: listening ? Infinity : 0 }}
            >
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14.1 6.7 11H5.1c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.6z" fill="currentColor" />
            </motion.svg>
            {listening ? 'Stop' : 'Speak'}
          </motion.button>
        ) : (
          <span className="voiced-note">Voice works on Android + desktop Chrome. Here, just type it.</span>
        )}
        {supported && (
          <motion.span
            className={`voiced-note ${listening ? 'listening' : ''}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={springSoft}
          >
            {listening ? 'Listening — speak naturally, Hinglish is fine' : 'Optional — speak it instead of typing'}
          </motion.span>
        )}
      </div>
    </div>
  )
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
  invalid = false,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
  invalid?: boolean
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`txt-area ${invalid ? 'invalid' : ''}`}
      aria-invalid={invalid || undefined}
      data-invalid={invalid || undefined}
    />
  )
}

export function ProgressBar({ progress }: { progress: number }) {
  return (
    <motion.div
      className="progress-wrap"
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      initial={false}
      animate={{ height: 4 }}
    >
      <motion.div
        className="progress-bar"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ type: 'spring', stiffness: 280, damping: 26, duration: 0.8 }}
      />
    </motion.div>
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
    <motion.header
      className="step-header"
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={springSoft}
    >
      {onBack && (
        <motion.button
          type="button"
          className="icon-btn"
          onClick={onBack}
          aria-label="Back"
          whileTap={{ scale: 0.9 }}
          whileHover={{ rotate: -15 }}
        >
          <svg viewBox="0 0 24 24" width="24" height="24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor"/></svg>
        </motion.button>
      )}
      <div className="step-counter">
        <motion.span
          className="step-num"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springSoft, delay: 0.1 }}
        >
          {current}
        </motion.span>
        <span className="step-div">of</span>
        <span className="step-total">{total}</span>
      </div>
      {onClose && (
        <motion.button
          type="button"
          className="icon-btn"
          onClick={onClose}
          aria-label="Close"
          whileTap={{ scale: 0.9 }}
          whileHover={{ rotate: 90 }}
        >
          <svg viewBox="0 0 24 24" width="24" height="24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/></svg>
        </motion.button>
      )}
    </motion.header>
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
        <motion.h2
          className="section-title"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springSoft}
        >
          {title}
        </motion.h2>
        {subtitle && (
          <motion.p
            className="section-sub"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springSoft, delay: 0.05 }}
          >
            {subtitle}
          </motion.p>
        )}
      </div>
      <motion.div
        initial="initial"
        animate="enter"
        variants={{ initial: {}, enter: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } } }}
      >
        {typeof children === 'object' && children !== null && 'props' in children && Array.isArray((children as any).props?.children)
          ? (children as any).props.children.map((child: any, i: number) =>
              React.cloneElement(child, { key: child.key ?? i })
            )
          : children}
      </motion.div>
    </section>
  )
}

export function Hint({ children }: { children: React.ReactNode }) {
  return <p className="hint">{children}</p>
}

// Staggered question block wrapper
export function QuestionBlock({ number, title, subtitle, children, index = 0 }: {
  number?: string
  title: string
  subtitle?: string
  children: React.ReactNode
  index?: number
}) {
  return (
    <motion.div
      className="q-block"
      variants={questionVariants}
      custom={index}
    >
      <motion.div
        className="q-head"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
      >
        {number && <motion.span className="q-num" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={springQuick}>{number}</motion.span>}
        <div>
          <div className="q-title">{title}</div>
          {subtitle && <div className="q-sub">{subtitle}</div>}
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] as const, delay: 0.05 }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

// Smooth collapse/expand for conditional content
export function Collapsible({ isOpen, children, className = '' }: {
  isOpen: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={className}
          initial={{ opacity: 0, height: 0, y: -10 }}
          animate={{ opacity: 1, height: 'auto', y: 0 }}
          exit={{ opacity: 0, height: 0, y: -10 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] as const }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Modal/Sheet backdrop with spring
export function ModalBackdrop({ isOpen, onClose, children }: {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            transition={{ duration: 0.2 }}
          />
          <motion.div
            className="sheet"
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={spring}
            onClick={e => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Detail modal for product/procedure rows
export function DetailModal({ isOpen, onClose, children }: {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="detail-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            transition={{ duration: 0.15 }}
          />
          <motion.div
            className="detail-card"
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.94 }}
            transition={spring}
            onClick={e => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
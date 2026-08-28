import { useEffect, useState } from 'react'

const mq = typeof window !== 'undefined' && window.matchMedia
  ? window.matchMedia('(min-width: 1024px)')
  : null

export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(() => mq ? mq.matches : false)
  useEffect(() => {
    if (!mq) return
    const onChange = () => setIsDesktop(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return isDesktop
}
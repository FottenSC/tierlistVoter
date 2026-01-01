import { useState, useEffect } from 'react'

export function NumberTicker({ value, duration = 1200, delay = 0, className }: { value: number, duration?: number, delay?: number, className?: string }) {
  const [displayValue, setDisplayValue] = useState(value)

  useEffect(() => {
    const start = displayValue
    const end = value
    if (start === end) return

    const startTimeOffset = performance.now() + delay

    const animate = (currentTime: number) => {
      if (currentTime < startTimeOffset) {
        requestAnimationFrame(animate)
        return
      }

      const elapsed = currentTime - startTimeOffset
      const progress = Math.min(elapsed / duration, 1)
      
      const easeOutExpo = (x: number): number => {
        return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
      }
      
      const easedProgress = easeOutExpo(progress)
      const current = Math.round(start + (end - start) * easedProgress)
      
      setDisplayValue(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration])

  return <span className={className}>{displayValue}</span>
}

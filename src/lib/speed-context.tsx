import { createContext, useContext, useState, ReactNode } from 'react'

export type SpeedOption = 'slow' | 'normal' | 'fast' | 'instant'

interface SpeedContextType {
  speed: SpeedOption
  setSpeed: (speed: SpeedOption) => void
  getTickerDuration: () => number
  getTransitionDelay: () => number
}

const speedSettings: Record<SpeedOption, { tickerDuration: number; transitionDelay: number }> = {
  slow: { tickerDuration: 1000, transitionDelay: 2500 },
  normal: { tickerDuration: 1000, transitionDelay: 1800 },
  fast: { tickerDuration: 700, transitionDelay: 1200 },
  instant: { tickerDuration: 0, transitionDelay: 0 },
}

const SpeedContext = createContext<SpeedContextType | undefined>(undefined)

export function SpeedProvider({ children }: { children: ReactNode }) {
  const [speed, setSpeed] = useState<SpeedOption>(() => {
    if (typeof window === 'undefined') return 'normal'
    return (localStorage.getItem('animation-speed') as SpeedOption) || 'normal'
  })

  const handleSetSpeed = (newSpeed: SpeedOption) => {
    setSpeed(newSpeed)
    if (typeof window !== 'undefined') {
      localStorage.setItem('animation-speed', newSpeed)
    }
  }

  const getTickerDuration = () => speedSettings[speed].tickerDuration
  const getTransitionDelay = () => speedSettings[speed].transitionDelay

  return (
    <SpeedContext.Provider value={{ speed, setSpeed: handleSetSpeed, getTickerDuration, getTransitionDelay }}>
      {children}
    </SpeedContext.Provider>
  )
}

export function useSpeed() {
  const context = useContext(SpeedContext)
  if (!context) {
    throw new Error('useSpeed must be used within a SpeedProvider')
  }
  return context
}

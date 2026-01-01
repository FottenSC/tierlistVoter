import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import type { Character } from './types'

interface MatchContextType {
  currentPair: [Character, Character] | null
  setCurrentPair: (pair: [Character, Character] | null) => void
  nextPair: [Character, Character] | null
  setNextPair: (pair: [Character, Character] | null) => void
}

const MatchContext = createContext<MatchContextType | undefined>(undefined)

export function MatchProvider({ children }: { children: ReactNode }) {
  const [currentPair, setCurrentPair] = useState<[Character, Character] | null>(null)
  const [nextPair, setNextPair] = useState<[Character, Character] | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const storedPair = localStorage.getItem('current-match-pair')
    const storedNextPair = localStorage.getItem('next-match-pair')
    
    if (storedPair) {
      try {
        setCurrentPair(JSON.parse(storedPair))
      } catch (e) {
        console.error('Failed to parse stored current pair', e)
      }
    }
    
    if (storedNextPair) {
      try {
        setNextPair(JSON.parse(storedNextPair))
      } catch (e) {
        console.error('Failed to parse stored next pair', e)
      }
    }
  }, [])

  // Save current pair to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && currentPair) {
      localStorage.setItem('current-match-pair', JSON.stringify(currentPair))
    }
  }, [currentPair])

  // Save next pair to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && nextPair) {
      localStorage.setItem('next-match-pair', JSON.stringify(nextPair))
    }
  }, [nextPair])

  return (
    <MatchContext.Provider value={{ currentPair, setCurrentPair, nextPair, setNextPair }}>
      {children}
    </MatchContext.Provider>
  )
}

export function useMatch() {
  const context = useContext(MatchContext)
  if (!context) {
    throw new Error('useMatch must be used within a MatchProvider')
  }
  return context
}

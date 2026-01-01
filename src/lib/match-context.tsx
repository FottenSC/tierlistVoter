import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef, useMemo } from 'react'
import type { Character } from './types'
import { characters as initialCharacters } from './characters'

interface MatchContextType {
  currentPair: [Character, Character] | null
  setCurrentPair: (pair: [Character, Character] | null) => void
  nextPair: [Character, Character] | null
  setNextPair: (pair: [Character, Character] | null) => void
  popNextPair: (chars: Character[]) => [Character, Character] | null
  resetQueue: () => void
  queueProgress: {
    current: number
    total: number
  }
  isFinished: boolean
}

const MatchContext = createContext<MatchContextType | undefined>(undefined)

// Helper to shuffle an array
const shuffle = <T,>(array: T[]): T[] => {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

// Helper to generate all unique pairs
const generateAllPairs = (chars: Character[]): [number, number][] => {
  const pairs: [number, number][] = []
  for (let i = 0; i < chars.length; i++) {
    for (let j = i + 1; j < chars.length; j++) {
      pairs.push([chars[i].id, chars[j].id])
    }
  }
  return shuffle(pairs)
}

export function MatchProvider({ children }: { children: ReactNode }) {
  const [currentPair, setCurrentPair] = useState<[Character, Character] | null>(() => {
    if (typeof window === 'undefined') return null
    const stored = localStorage.getItem('current-match-pair')
    try { return stored ? JSON.parse(stored) : null } catch { return null }
  })
  const [nextPair, setNextPair] = useState<[Character, Character] | null>(() => {
    if (typeof window === 'undefined') return null
    const stored = localStorage.getItem('next-match-pair')
    try { return stored ? JSON.parse(stored) : null } catch { return null }
  })
  const [queueLength, setQueueLength] = useState(() => {
    if (typeof window === 'undefined') return 0
    const stored = localStorage.getItem('match-queue')
    try { return stored ? JSON.parse(stored).length : 0 } catch { return 0 }
  })
  const queueRef = useRef<[number, number][]>(
    typeof window !== 'undefined'
      ? (() => {
          const stored = localStorage.getItem('match-queue')
          try { return stored ? JSON.parse(stored) : [] } catch { return [] }
        })()
      : []
  )

  const totalMatches = useMemo(() => {
    const n = initialCharacters.length
    return (n * (n - 1)) / 2
  }, [])

  // Initialize queue and pairs if completely empty
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    if (!localStorage.getItem('match-queue') && queueRef.current.length === 0) {
      const newQueue = generateAllPairs(initialCharacters)
      
      if (newQueue.length > 0) {
        const id1 = newQueue[0]
        const id2 = newQueue[1]
        const remaining = newQueue.slice(2)
        
        queueRef.current = remaining
        setQueueLength(remaining.length)
        
        const c1 = initialCharacters.find(c => c.id === id1[0])
        const c2 = initialCharacters.find(c => c.id === id1[1])
        const n1 = id2 ? initialCharacters.find(c => c.id === id2[0]) : null
        const n2 = id2 ? initialCharacters.find(c => c.id === id2[1]) : null

        if (c1 && c2) {
          setCurrentPair([c1, c2])
          localStorage.setItem('current-match-pair', JSON.stringify([c1, c2]))
        }
        if (n1 && n2) {
          setNextPair([n1, n2])
          localStorage.setItem('next-match-pair', JSON.stringify([n1, n2]))
        }

        localStorage.setItem('match-queue', JSON.stringify(remaining))
      }
    }
  }, [])

  // Save current pair to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (currentPair) {
        localStorage.setItem('current-match-pair', JSON.stringify(currentPair))
      } else {
        localStorage.removeItem('current-match-pair')
      }
    }
  }, [currentPair])

  // Save next pair to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (nextPair) {
        localStorage.setItem('next-match-pair', JSON.stringify(nextPair))
      } else {
        localStorage.removeItem('next-match-pair')
      }
    }
  }, [nextPair])

  const popNextPair = useCallback((chars: Character[]): [Character, Character] | null => {
    if (queueRef.current.length === 0) {
      return null
    }

    const [id1, id2] = queueRef.current[0]
    queueRef.current = queueRef.current.slice(1)
    setQueueLength(queueRef.current.length)
    
    // Sync to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('match-queue', JSON.stringify(queueRef.current))
    }

    const c1 = chars.find(c => c.id === id1)
    const c2 = chars.find(c => c.id === id2)
    
    if (c1 && c2) return [c1, c2]
    
    // If characters not found (shouldn't happen), try next
    return popNextPair(chars)
  }, [])

  const resetQueue = useCallback(() => {
    const newQueue = generateAllPairs(initialCharacters)
    
    if (newQueue.length > 0) {
      // Pick new initial pairs immediately
      const id1 = newQueue[0]
      const id2 = newQueue[1]
      const remaining = newQueue.slice(2)
      queueRef.current = remaining
      setQueueLength(remaining.length)

      const c1 = initialCharacters.find(c => c.id === id1[0])
      const c2 = initialCharacters.find(c => c.id === id1[1])
      const n1 = id2 ? initialCharacters.find(c => c.id === id2[0]) : null
      const n2 = id2 ? initialCharacters.find(c => c.id === id2[1]) : null

      const cp: [Character, Character] | null = c1 && c2 ? [c1, c2] : null
      const np: [Character, Character] | null = n1 && n2 ? [n1, n2] : null

      setCurrentPair(cp)
      setNextPair(np)

      if (typeof window !== 'undefined') {
        localStorage.setItem('match-queue', JSON.stringify(remaining))
        localStorage.setItem('current-match-pair', JSON.stringify(cp))
        localStorage.setItem('next-match-pair', JSON.stringify(np))
      }
    } else {
      setCurrentPair(null)
      setNextPair(null)
      queueRef.current = []
      setQueueLength(0)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('match-queue')
        localStorage.removeItem('current-match-pair')
        localStorage.removeItem('next-match-pair')
      }
    }
  }, [])

  const isFinished = useMemo(() => {
    return currentPair === null && nextPair === null && queueLength === 0
  }, [currentPair, nextPair, queueLength])

  const queueProgress = useMemo(() => {
    if (isFinished) {
      return { current: totalMatches, total: totalMatches }
    }
    // Number of matches actually finished (scored)
    const completed = totalMatches - queueLength - (currentPair ? 1 : 0) - (nextPair ? 1 : 0)
    return {
      current: Math.max(0, completed),
      total: totalMatches
    }
  }, [queueLength, currentPair, nextPair, totalMatches, isFinished])

  return (
    <MatchContext.Provider value={{ currentPair, setCurrentPair, nextPair, setNextPair, popNextPair, resetQueue, queueProgress, isFinished }}>
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

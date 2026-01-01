import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { Character } from '@/lib/types'
import { characters as initialCharacters } from '@/lib/characters'
import { calculateNewRatings } from '@/lib/glicko'
import { VoteCard } from '@/components/vote-card'
import { SpeedSelector } from '@/components/speed-selector'
import { useSpeed } from '@/lib/speed-context'
import { useMatch } from '@/lib/match-context'
import { cn } from '@/lib/utils'

// Helper to get persistence from localStorage
const getStoredCharacters = (): Array<Character> => {
    if (typeof window === 'undefined') return initialCharacters
    const stored = localStorage.getItem('characters-data')
    if (stored) {
        try {
            const parsed = JSON.parse(stored) as Array<Character>
            // Merge with initial characters to ensure new properties (like circleImage) are present
            return initialCharacters.map(initial => {
                const found = parsed.find(p => p.id === initial.id)
                if (found) {
                    return { ...initial, ...found }
                }
                return initial
            })
        } catch (e) {
            console.error('Failed to parse stored characters', e)
        }
    }
    return initialCharacters
}

const saveCharacters = (chars: Array<Character>) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('characters-data', JSON.stringify(chars))
    }
}

const generatePair = (chars: Array<Character>): [Character, Character] => {
    const idx1 = Math.floor(Math.random() * chars.length)
    let idx2 = Math.floor(Math.random() * chars.length)
    while (idx1 === idx2) {
      idx2 = Math.floor(Math.random() * chars.length)
    }
    return [chars[idx1], chars[idx2]]
}

const prefetchImages = (chars: [Character, Character]) => {
    chars.forEach(c => {
        const img = new Image()
        img.src = `/Characters/${c.image}`
    })
}

export const Route = createFileRoute('/') ({
  component: Index,
})

function Index() {
  const [characters, setCharacters] = useState<Array<Character>>(getStoredCharacters)
  const [loading, setLoading] = useState(true)
  const [voteState, setVoteState] = useState<'idle' | 'voting' | 'success'>('idle')
  const [lastResult, setLastResult] = useState<{ winnerId: number; loserId: number } | null>(null)
  const [previousRanks, setPreviousRanks] = useState<{ [id: number]: number }>({})
  const { getTickerDuration, getTransitionDelay } = useSpeed()
  const { currentPair, setCurrentPair, nextPair, setNextPair } = useMatch()

  useEffect(() => {
    // Initial setup
    if (currentPair) {
      // Use stored pair if available
      setLoading(false)
    } else {
      const p1 = generatePair(characters)
      setCurrentPair(p1)
      
      const p2 = generatePair(characters)
      setNextPair(p2)
      prefetchImages(p2)
      
      setLoading(false)
    }
  }, []) // Pick once on mount

  const handleVote = (winner: Character, loser: Character) => {
    if (voteState !== 'idle' || !currentPair) return
    
    // Store previous ranks before vote
    const sortedBefore = [...characters].sort((a, b) => b.rating - a.rating)
    const prevRanks = {
      [currentPair[0].id]: sortedBefore.findIndex(c => c.id === currentPair[0].id) + 1,
      [currentPair[1].id]: sortedBefore.findIndex(c => c.id === currentPair[1].id) + 1,
    }
    setPreviousRanks(prevRanks)
    
    setVoteState('voting')
    setLastResult({ winnerId: winner.id, loserId: loser.id })

    // Calculate new ratings
    const { winner: newWinner, loser: newLoser } = calculateNewRatings(winner, loser)

    // Update local state and save to localStorage
    const updatedChars = characters.map(c => {
        if (c.id === winner.id) return { ...newWinner, vote_count: (winner as any).vote_count ? (winner as any).vote_count + 1 : 1 } as Character
        if (c.id === loser.id) return { ...newLoser, vote_count: (loser as any).vote_count ? (loser as any).vote_count + 1 : 1 } as Character
        return c
    })

    // Delay state update slightly so the result box mounts with the OLD rating first
    const updateDelay = Math.min(200, getTickerDuration() * 0.15)
    setTimeout(() => {
        setCharacters(updatedChars)
        saveCharacters(updatedChars)

        // Update the current pair with the new ratings so the ticker can animate
        const updatedPair: [Character, Character] = [
            updatedChars.find(c => c.id === currentPair[0].id)!,
            updatedChars.find(c => c.id === currentPair[1].id)!
        ]
        setCurrentPair(updatedPair)
    }, updateDelay)

    // Use speed context for transition delay
    setTimeout(() => {
        setLastResult(null)
        setVoteState('idle')
        setPreviousRanks({})
        
        let currentNextPair = nextPair
        if (!currentNextPair) {
             currentNextPair = generatePair(updatedChars)
        }

        // Refresh data for the new pair from updatedChars
        const p1 = updatedChars.find(c => c.id === currentNextPair[0].id) || currentNextPair[0]
        const p2 = updatedChars.find(c => c.id === currentNextPair[1].id) || currentNextPair[1]
        
        setCurrentPair([p1, p2])
        
        // Generate and prefetch the pair after that
        const newNext = generatePair(updatedChars)
        setNextPair(newNext)
        prefetchImages(newNext)
    }, getTransitionDelay()) 
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (voteState !== 'idle' || !currentPair) return
      
      if (e.key === 'ArrowLeft') {
        handleVote(currentPair[0], currentPair[1])
      } else if (e.key === 'ArrowRight') {
        handleVote(currentPair[1], currentPair[0])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentPair, voteState, handleVote])

  if (!currentPair && loading) {
    return (
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    )
  }

  if (!currentPair) return null

  const sortedChars = [...characters].sort((a, b) => b.rating - a.rating)
  const getRank = (id: number) => sortedChars.findIndex(c => c.id === id) + 1
  
  // Calculate rank change (positive = moved up, negative = moved down)
  const getRankChange = (id: number): number | null => {
    if (!previousRanks[id]) return null
    const currentRank = getRank(id)
    return previousRanks[id] - currentRank // positive means rank improved (went from lower # to higher #)
  }

  const tickerDuration = getTickerDuration()

  return (
    <div className="h-[calc(100vh-4rem)] w-full flex flex-col md:flex-row relative bg-background overflow-hidden">
      
      {/* Speed Selector - Top Right */}
      <div className="absolute top-4 right-4 z-40">
        <SpeedSelector />
      </div>

      {/* Left Character */}
      <div className="flex-1 relative h-full">
          <VoteCard 
              character={currentPair[0]} 
              rank={getRank(currentPair[0].id)}
              rankChange={getRankChange(currentPair[0].id)}
              onVote={() => handleVote(currentPair[0], currentPair[1])}
              disabled={voteState !== 'idle'}
              result={lastResult ? (lastResult.winnerId === currentPair[0].id ? 'win' : 'loss') : null}
              variant="fullscreen"
              className="h-full rounded-none border-none"
              mirrored={true}
              tickerDuration={tickerDuration}
          />
      </div>

      {/* Versus Text (Overlay) / Result Ticker */}
      <div className="absolute inset-0 z-20 pointer-events-none flex md:flex-col items-center justify-center gap-2 md:gap-2">
          <div className="w-20 md:w-[1px] h-[1px] md:h-40 bg-gradient-to-r md:bg-gradient-to-b from-transparent via-primary to-transparent opacity-80 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
          
          <div className="relative h-32 flex items-center justify-center">
              <span className={cn(
                  "text-6xl md:text-8xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-b from-[#fcd34d] to-[#b45309] drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)] tracking-widest scale-125 transition-all duration-500",
                  voteState !== 'idle' ? "opacity-0 scale-150 rotate-12" : "opacity-100"
              )}>
                  VS
              </span>
          </div>

          <div className="w-20 md:w-[1px] h-[1px] md:h-40 bg-gradient-to-r md:bg-gradient-to-b from-transparent via-primary to-transparent opacity-80 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
          
      </div>

      {/* Right Character */}
      <div className="flex-1 relative h-full">
          <VoteCard 
              character={currentPair[1]} 
              rank={getRank(currentPair[1].id)}
              rankChange={getRankChange(currentPair[1].id)}
              onVote={() => handleVote(currentPair[1], currentPair[0])}
              disabled={voteState !== 'idle'}
              result={lastResult ? (lastResult.winnerId === currentPair[1].id ? 'win' : 'loss') : null}
              variant="fullscreen"
              className="h-full rounded-none border-none"
              tickerDuration={tickerDuration}
          />
      </div>

      {/* Global Bottom UI */}
      <div className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-6 z-30 pointer-events-none">
          <div className="flex justify-center items-center gap-64 transition-opacity duration-500" style={{ opacity: voteState === 'idle' ? 1 : 0 }}>
              <div className="px-3 py-1 bg-black/40 backdrop-blur-sm border border-white/20 rounded text-white/50 font-mono text-sm animate-bounce">
                  ←
              </div>
              <div className="px-3 py-1 bg-black/40 backdrop-blur-sm border border-white/20 rounded text-white/50 font-mono text-sm animate-bounce">
                  →
              </div>
          </div>

          <div className={cn(
              "text-center text-white/50 text-sm font-serif italic tracking-widest uppercase animate-pulse transition-opacity duration-500",
              voteState !== 'idle' ? "opacity-0" : "opacity-100"
          )}>
              Select the better character or use keys
          </div>
      </div>
    </div>
  )
}


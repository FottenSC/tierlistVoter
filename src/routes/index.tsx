import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useCallback } from 'react'
import { characters as initialCharacters } from '@/lib/characters'
import { Character } from '@/lib/types'
import { calculateNewRatings } from '@/lib/glicko'
import { VoteCard } from '@/components/vote-card'
import { SpeedSelector } from '@/components/speed-selector'
import { useSpeed } from '@/lib/speed-context'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// Helper to get persistence from localStorage
const getStoredCharacters = (): Character[] => {
    if (typeof window === 'undefined') return initialCharacters
    const stored = localStorage.getItem('characters-data')
    if (stored) {
        try {
            const parsed = JSON.parse(stored) as Character[]
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

const saveCharacters = (chars: Character[]) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('characters-data', JSON.stringify(chars))
    }
}

export const Route = createFileRoute('/') ({
  component: Index,
})

function Index() {
  const [characters, setCharacters] = useState<Character[]>(getStoredCharacters)
  const [pair, setPair] = useState<[Character, Character] | null>(null)
  const [loading, setLoading] = useState(true)
  const [voteState, setVoteState] = useState<'idle' | 'voting' | 'success'>('idle')
  const [lastResult, setLastResult] = useState<{ winnerId: number; loserId: number } | null>(null)
  const [previousRanks, setPreviousRanks] = useState<{ [id: number]: number }>({})
  const { getTickerDuration, getTransitionDelay } = useSpeed()

  // Pick 2 randoms from our state
  const fetchNewPair = useCallback(() => {
    setLoading(true)
    setLastResult(null)
    setVoteState('idle')
    setPreviousRanks({})
    
    const idx1 = Math.floor(Math.random() * characters.length)
    let idx2 = Math.floor(Math.random() * characters.length)
    while (idx1 === idx2) {
      idx2 = Math.floor(Math.random() * characters.length)
    }

    setPair([characters[idx1], characters[idx2]])
    setLoading(false)
  }, [characters])

  useEffect(() => {
    fetchNewPair()
  }, []) // Pick once on mount

  const handleVote = async (winner: Character, loser: Character) => {
    if (voteState !== 'idle' || !pair) return
    
    // Store previous ranks before vote
    const sortedBefore = [...characters].sort((a, b) => b.rating - a.rating)
    const prevRanks = {
      [pair[0].id]: sortedBefore.findIndex(c => c.id === pair[0].id) + 1,
      [pair[1].id]: sortedBefore.findIndex(c => c.id === pair[1].id) + 1,
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
            updatedChars.find(c => c.id === pair[0].id)!,
            updatedChars.find(c => c.id === pair[1].id)!
        ]
        setPair(updatedPair)
    }, updateDelay)

    // Use speed context for transition delay
    setTimeout(() => {
        fetchNewPair()
    }, getTransitionDelay()) 
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (voteState !== 'idle' || !pair) return
      
      if (e.key === 'ArrowLeft') {
        handleVote(pair[0], pair[1])
      } else if (e.key === 'ArrowRight') {
        handleVote(pair[1], pair[0])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [pair, voteState, handleVote])

  if (!pair && loading) {
    return (
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    )
  }

  if (!pair) return null

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
    <div className="h-[calc(100vh-4rem)] w-full flex relative bg-background overflow-hidden">
      
      {/* Speed Selector - Top Right */}
      <div className="absolute top-4 right-4 z-40">
        <SpeedSelector />
      </div>

      {/* Left Character */}
      <div className="flex-1 relative h-full">
          <VoteCard 
              character={pair[0]} 
              rank={getRank(pair[0].id)}
              rankChange={getRankChange(pair[0].id)}
              onVote={() => handleVote(pair[0], pair[1])}
              disabled={voteState !== 'idle'}
              result={lastResult ? (lastResult.winnerId === pair[0].id ? 'win' : 'loss') : null}
              variant="fullscreen"
              className="h-full rounded-none border-none"
              mirrored={true}
              tickerDuration={tickerDuration}
          />
      </div>

      {/* Versus Text (Overlay) / Result Ticker */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-20 pointer-events-none flex flex-col items-center justify-center gap-2">
          <div className="h-40 w-[1px] bg-gradient-to-b from-transparent via-primary to-transparent opacity-80 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
          
          <div className="relative h-32 flex items-center justify-center">
              <span className={cn(
                  "text-8xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-b from-[#fcd34d] to-[#b45309] drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)] tracking-widest scale-125 transition-all duration-500",
                  voteState !== 'idle' ? "opacity-0 scale-150 rotate-12" : "opacity-100"
              )}>
                  VS
              </span>
          </div>

          <div className="h-40 w-[1px] bg-gradient-to-b from-transparent via-primary to-transparent opacity-80 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
          
      </div>

      {/* Right Character */}
      <div className="flex-1 relative h-full">
          <VoteCard 
              character={pair[1]} 
              rank={getRank(pair[1].id)}
              rankChange={getRankChange(pair[1].id)}
              onVote={() => handleVote(pair[1], pair[0])}
              disabled={voteState !== 'idle'}
              result={lastResult ? (lastResult.winnerId === pair[1].id ? 'win' : 'loss') : null}
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


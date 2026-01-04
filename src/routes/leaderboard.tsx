import { createFileRoute } from '@tanstack/react-router'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { RotateCcw, Settings2, Share2, X } from "lucide-react"
import { snapdom } from '@zumer/snapdom'
import { toast } from 'sonner'
import type { Character } from '@/lib/types'
import { characters as initialCharacters } from '@/lib/characters'
import { useMatch } from '@/lib/match-context'
import { CharacterDetailsModal } from "@/components/character-details-modal"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

// Global to track hydration across navigations
let hasHydratedGlobal = false

// Helper to ensure color is in hex format for input[type="color"]
const ensureHex = (color: string) => {
  if (color.startsWith('rgb')) {
    const rgb = color.match(/\d+/g)
    if (rgb && rgb.length >= 3) {
      return '#' + rgb.slice(0, 3).map(x => parseInt(x).toString(16).padStart(2, '0')).join('')
    }
  }
  return color
}

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

// Default tier configuration
interface TierConfig {
  label: string
  count: number | string
  color: string
}

const DEFAULT_TIER_CONFIG: Array<TierConfig> = [
  { label: 'S', count: 5, color: '#FF7F7F' },
  { label: 'A', count: 6, color: '#FFBF7F' },
  { label: 'B', count: 6, color: '#FFDF7F' },
  { label: 'C', count: 6, color: '#FFFF7F' },
  { label: 'D', count: 5, color: '#BFFF7F' },
  { label: 'E', count: 5, color: '#7FFF7F' },
]

// Get stored tier config
const getStoredTierConfig = (): Array<TierConfig> => {
  if (typeof window === 'undefined') return DEFAULT_TIER_CONFIG
  const stored = localStorage.getItem('tier-config')
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch (e) {
      console.error('Failed to parse tier config', e)
    }
  }
  return DEFAULT_TIER_CONFIG
}

export const Route = createFileRoute('/leaderboard')({
  component: Leaderboard,
  head: () => ({
    meta: [
      {
        title: 'Tierlist Voter',
      },
      {
        name: 'description',
        content: 'View the tier list.',
      },
      {
        property: 'og:title',
        content: 'Tierlist Voter',
      },
      {
        property: 'og:description',
        content: 'View the tier list.',
      },
      {
        property: 'og:image',
        content: '/og-image.png',
      },
      {
        name: 'twitter:image',
        content: '/og-image.png',
      },
    ],
  }),
})

interface TierRowProps {
  label: string
  color: string
  characters: Array<Character>
  startRank: number
  isLast?: boolean
  onCharacterClick: (character: Character) => void
}

const TierRow = memo(function TierRow({ label, color, characters, startRank, isLast, onCharacterClick }: TierRowProps) {
  return (
    <div className="flex border-b border-black/50 last:border-b-0 relative">
      {/* Tier label */}
      <div 
        className="w-16 md:w-32 min-h-[60px] md:min-h-[110px] flex-shrink-0 flex items-center justify-center text-center font-bold text-xl md:text-3xl text-[#333] border-r border-black/50 p-1"
        style={{ backgroundColor: color }}
      >
        {label}
      </div>
      
      {/* Character row */}
      <div className="flex-1 flex flex-wrap items-center gap-0 bg-[#1a1a1a] min-h-[60px] md:min-h-[110px]">
        {characters.map((char, index) => (
          <div
            key={char.id}
            className="relative group w-14 h-14 md:w-[105px] md:h-[105px] cursor-pointer"
            onClick={() => onCharacterClick(char)}
          >
            <img 
              src={char.circleImage ? `/Characters/Circles/${char.circleImage}` : `/Characters/${char.image}`}
              alt={char.name}
              className="w-full h-full object-cover"
            />
            {/* Hover overlay with rank and name */}
            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-0 group-hover:delay-10 flex flex-col items-center justify-center text-white text-[10px] md:text-xs font-bold pointer-events-none">
              <span className="text-primary">#{startRank + index}</span>
              <span className="text-center px-1 leading-tight">{char.name}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Zoetrope - Bottom Right of Lowest Tier */}
      {isLast && (
        <div className="absolute bottom-2 right-2 opacity-40 hover:opacity-100 transition-opacity duration-500 pointer-events-auto">
          <img src="/zoetrope.png" alt="Zoetrope" className="w-16 h-16 object-contain " />
        </div>
      )}
    </div>
  )
})

function Leaderboard() {
  const [isReady, setIsReady] = useState(hasHydratedGlobal)
  const [data, setData] = useState<Array<Character>>(() => {
    if (hasHydratedGlobal) {
      const chars = getStoredCharacters()
      return [...chars].sort((a, b) => b.rating - a.rating)
    }
    return []
  })
  const [sharing, setSharing] = useState(false)
  const [tierConfig, setTierConfig] = useState<Array<TierConfig>>(() => {
    if (hasHydratedGlobal) return getStoredTierConfig()
    return []
  })
  const [confirmText, setConfirmText] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const tierlistRef = useRef<HTMLDivElement>(null)
  const { resetQueue } = useMatch()

  useEffect(() => {
    if (!hasHydratedGlobal) {
      const chars = getStoredCharacters()
      setData([...chars].sort((a, b) => b.rating - a.rating))
      setTierConfig(getStoredTierConfig())
      hasHydratedGlobal = true
      setIsReady(true)
    }
  }, [])

  const handleCharacterClick = useCallback((character: Character) => {
    setSelectedCharacter(character)
    setDetailsOpen(true)
  }, [])

  const handleReset = () => {
    localStorage.removeItem('characters-data')
    localStorage.removeItem('match-queue')
    localStorage.removeItem('current-match-pair')
    localStorage.removeItem('next-match-pair')
    localStorage.removeItem('match-history')
    resetQueue()
    const chars = getStoredCharacters()
    setData([...chars].sort((a, b) => b.rating - a.rating))
    setConfirmText('')
    setIsOpen(false)
    toast.success('All character data and match queue have been reset.')
  }

  const handleTierCountChange = (index: number, value: string) => {
    const newConfig = [...tierConfig]
    let count: number | string = value
    if (value !== '') {
      count = Math.max(1, Math.min(28, parseInt(value) || 1))
    }
    newConfig[index] = { ...newConfig[index], count }
    setTierConfig(newConfig)
    localStorage.setItem('tier-config', JSON.stringify(newConfig))
  }

  const handleTierLabelChange = (index: number, newLabel: string) => {
    const newConfig = [...tierConfig]
    newConfig[index] = { ...newConfig[index], label: newLabel }
    setTierConfig(newConfig)
    localStorage.setItem('tier-config', JSON.stringify(newConfig))
  }

  const handleTierColorChange = (index: number, newColor: string) => {
    const newConfig = [...tierConfig]
    newConfig[index] = { ...newConfig[index], color: newColor }
    setTierConfig(newConfig)
    localStorage.setItem('tier-config', JSON.stringify(newConfig))
  }

  const addTier = () => {
    const newConfig = [...tierConfig, { label: String(tierConfig.length + 1), count: 3, color: '#7FFF7F' }]
    setTierConfig(newConfig)
    localStorage.setItem('tier-config', JSON.stringify(newConfig))
  }

  const removeTier = (index: number) => {
    if (tierConfig.length <= 1) return
    const newConfig = tierConfig.filter((_, i) => i !== index)
    setTierConfig(newConfig)
    localStorage.setItem('tier-config', JSON.stringify(newConfig))
  }

  const resetTierConfig = () => {
    setTierConfig(DEFAULT_TIER_CONFIG)
    localStorage.setItem('tier-config', JSON.stringify(DEFAULT_TIER_CONFIG))
  }

  const handleShare = async () => {
    if (!tierlistRef.current) return
    setSharing(true)
    try {
      const blob = await snapdom.toBlob(tierlistRef.current, {
        type: 'png',
        backgroundColor: '#1a1a1a',
        scale: 2,
        embedFonts: true,
      })
      
      const previewUrl = URL.createObjectURL(blob)
      
      // Try to copy to clipboard first
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob
          })
        ])
        toast.success('Tierlist copied to clipboard!', {
          description: (
            <div className="mt-2 border border-primary/30 bg-black/20 p-0.5 shadow-inner overflow-hidden">
              <img 
                src={previewUrl} 
                alt="Tierlist Preview" 
                className="w-full h-auto max-h-40 object-contain block"
              />
            </div>
          ),
          duration: 5000,
        })
        return
      } catch (clipboardErr) {
        console.error('Clipboard copy failed:', clipboardErr)
      }
      
      // Fallback to download if clipboard fails or is not supported
      const link = document.createElement('a')
      link.href = previewUrl
      link.download = 'tierlist.png'
      link.click()
      
      toast.info('Tierlist downloaded!', {
        description: (
          <div className="space-y-2">
            <p className="text-xs opacity-70">Clipboard copy not supported in this browser.</p>
            <div className="border border-primary/30 bg-black/20 p-0.5 shadow-inner overflow-hidden">
              <img 
                src={previewUrl} 
                alt="Tierlist Preview" 
                className="w-full h-auto max-h-40 object-contain block"
              />
            </div>
          </div>
        ),
        duration: 5000,
      })
    } catch (err) {
      console.error('Failed to share tierlist:', err)
      toast.error('Failed to capture tierlist. Please try again.')
    } finally {
      setSharing(false)
    }
  }

  // Calculate tier assignments
  const tiersWithCharacters = useMemo(() => {
    let currentIndex = 0
    return tierConfig.map((tier) => {
      const count = typeof tier.count === 'number' ? tier.count : (parseInt(tier.count) || 0)
      const tierCharacters = data.slice(currentIndex, currentIndex + count)
      const startRank = currentIndex + 1
      currentIndex += count
      return {
        ...tier,
        characters: tierCharacters,
        startRank,
      }
    })
  }, [data, tierConfig])

  if (!isReady) {
    return (
      <div className="min-h-[calc(100vh-4rem)] w-full bg-gradient-to-b from-muted via-muted/20 to-black">
        <div className="container py-8 max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <h1 className="text-4xl font-serif font-bold tracking-widest text-primary uppercase drop-shadow-md">Your Tierlist</h1>
          </div>
          <div className="rounded-lg overflow-hidden border border-black/50 shadow-2xl bg-[#1a1a1a]/50 backdrop-blur-sm h-[600px] flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-primary font-serif italic tracking-widest animate-pulse uppercase text-sm">Loading Stage of History...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-gradient-to-b from-muted via-muted/20 to-black">
      <div className="container py-8 max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-2 gap-4">
          <h1 className="text-4xl font-serif font-bold tracking-widest text-primary uppercase drop-shadow-md">Your Tierlist</h1>
          
          <div className="flex items-center -space-x-px">
            {/* Share Button */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleShare} 
              disabled={sharing}
              className="gap-2 text-muted-foreground hover:text-primary hover:border-primary transition-colors rounded-r-none"
            >
              <Share2 className={cn("h-4 w-4", sharing && "animate-spin")} />
              {sharing ? 'Capturing...' : 'Share Tierlist'}
            </Button>

            {/* Tier Settings */}
            <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
              <PopoverTrigger
                render={
                  <Button variant="outline" size="icon-sm" className="text-muted-foreground hover:text-primary hover:border-primary transition-colors rounded-none" title="Configure Tiers">
                    <Settings2 className="h-4 w-4" />
                  </Button>
                }
              />
              <PopoverContent className="w-80 max-h-[70vh] overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium leading-none">Tier Configuration</h4>
                      {(() => {
                        const totalCount = tierConfig.reduce((acc: number, t: TierConfig) => acc + (typeof t.count === 'number' ? t.count : (parseInt(t.count) || 0)), 0)
                        const showWarning = totalCount < data.length
                        return (
                          <div className={cn(
                            "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border flex items-center transition-colors",
                            showWarning 
                              ? "bg-destructive/20 text-destructive border-destructive/30" 
                              : "bg-primary/20 text-primary border-primary/30"
                          )}>
                            {totalCount}/{data.length}
                          </div>
                        )
                      })()}
                    </div>
                    <Button variant="ghost" size="sm" onClick={resetTierConfig} className="text-xs hover:text-primary transition-colors">
                      Reset
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {tierConfig.map((tier: TierConfig, index: number) => (
                      <div key={index} className="flex items-center gap-2 p-2 rounded bg-muted/50">
                        <input
                          type="color"
                          value={ensureHex(tier.color)}
                          onChange={(e) => handleTierColorChange(index, e.target.value)}
                          className="w-10 h-10 rounded cursor-pointer border-2 border-muted-foreground/20 hover:border-primary transition-colors p-0 overflow-hidden"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs w-14 font-semibold shrink-0">Label:</Label>
                            <Input
                              value={tier.label}
                              onChange={(e) => handleTierLabelChange(index, e.target.value)}
                              className="h-8 text-sm bg-background border-2 border-muted-foreground/40 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all font-medium flex-1"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs w-14 font-semibold shrink-0">Count:</Label>
                            <Input
                              type="number"
                              min={1}
                              max={28}
                              value={tier.count}
                              onChange={(e) => handleTierCountChange(index, e.target.value)}
                              className="h-8 text-sm bg-background border-2 border-muted-foreground/40 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all font-medium flex-1"
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTier(index)}
                          disabled={tierConfig.length <= 1}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" onClick={addTier} className="w-full">
                    Add Tier
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Reset All */}
            <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
              <AlertDialogTrigger 
                render={
                  <Button variant="outline" size="icon-sm" className="text-muted-foreground hover:text-destructive hover:border-destructive transition-colors rounded-l-none" title="Reset All Characters">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset all character data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently reset all character ratings, RD, and matches to their initial values.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="my-4 space-y-2">
                  <p className="text-sm font-medium">Please type <span className="font-bold text-foreground">YES</span> to confirm.</p>
                  <Input 
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="YES"
                    className="font-bold"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && confirmText === 'YES') {
                        handleReset()
                      }
                    }}
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setConfirmText('')}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      if (confirmText !== 'YES') {
                        e.preventDefault()
                      } else {
                        handleReset()
                      }
                    }}
                    disabled={confirmText !== 'YES'}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reset Everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        
        {/* Tier List */}
        <div ref={tierlistRef} className="rounded-lg overflow-hidden border border-black/50 shadow-2xl">
          
          {/* Tier rows */}
          {tiersWithCharacters.map((tier, index: number) => (
            <TierRow
              key={index}
              label={tier.label}
              color={tier.color}
              characters={tier.characters}
              startRank={tier.startRank}
              isLast={index === tiersWithCharacters.length - 1}
              onCharacterClick={handleCharacterClick}
            />
          ))}
        </div>
      </div>

      <CharacterDetailsModal
        character={selectedCharacter}
        allCharacters={data}
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
      />
    </div>
  )
}

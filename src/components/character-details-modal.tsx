import { useEffect, useState } from "react"
import type { Character, Match } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface CharacterDetailsModalProps {
  character: Character | null
  allCharacters: Array<Character>
  isOpen: boolean
  onClose: () => void
}

export function CharacterDetailsModal({ character, allCharacters, isOpen, onClose }: CharacterDetailsModalProps) {
  const [betterThan, setBetterThan] = useState<Array<Character>>([])
  const [worseThan, setWorseThan] = useState<Array<Character>>([])

  useEffect(() => {
    if (isOpen && character) {
      const storedMatches = localStorage.getItem('match-history')
      if (storedMatches) {
        try {
          const matches: Array<Match> = JSON.parse(storedMatches)
          
          const wonAgainstIds = new Set<number>()
          const lostToIds = new Set<number>()

          matches.forEach(match => {
            if (match.winner_id === character.id) {
              wonAgainstIds.add(match.loser_id)
            } else if (match.loser_id === character.id) {
              lostToIds.add(match.winner_id)
            }
          })

          setBetterThan(allCharacters.filter(c => wonAgainstIds.has(c.id)))
          setWorseThan(allCharacters.filter(c => lostToIds.has(c.id)))
        } catch (e) {
          console.error('Failed to parse match history', e)
        }
      } else {
        setBetterThan([])
        setWorseThan([])
      }
    }
  }, [isOpen, character, allCharacters])

  if (!character) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden flex flex-col gap-0 bg-[#1a1a1a] border-white/10 top-[10%] translate-y-0">
        
        {/* Header */}
        <div className="flex items-center gap-6 p-6 border-b border-white/10 bg-black/20">
          <div className="relative w-20 h-20 rounded-full overflow-hidden shadow-xl bg-black/40 shrink-0">
            <img 
              src={character.circleImage ? `/Characters/Circles/${character.circleImage}` : `/Characters/${character.image}`}
              alt={character.name} 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col gap-2">
            <DialogTitle className="text-4xl md:text-5xl font-black tracking-tight uppercase leading-none">{character.name}</DialogTitle>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="font-mono text-xs border border-white/10 bg-black/40 text-primary hover:bg-black/60">
                RATING: {Math.round(character.rating)}
              </Badge>
              <Badge variant="secondary" className="font-mono text-xs border border-white/10 bg-black/40 text-muted-foreground hover:bg-black/60">
                DEV: {Math.round(character.rd)}
              </Badge>
              <Badge variant="secondary" className="font-mono text-xs border border-white/10 bg-black/40 text-muted-foreground hover:bg-black/60">
                VOL: {character.vol.toFixed(4)}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {/* Match History */}
          <div className="flex flex-col gap-6">
            {/* Better Than */}
            <div className="space-y-4 flex flex-col">
              <div className="flex items-center justify-between border-b border-green-500/20 pb-2">
                <h4 className="text-sm font-bold text-green-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Better Than
                </h4>
                <span className="text-xs font-mono text-muted-foreground">{betterThan.length}</span>
              </div>
              <div className="flex flex-wrap gap-2 content-start">
                {betterThan.length > 0 ? (
                  betterThan.map(char => (
                    <div key={char.id} className="relative group w-12 h-12 rounded-md overflow-hidden transition-colors" title={char.name}>
                      <img 
                        src={char.circleImage ? `/Characters/Circles/${char.circleImage}` : `/Characters/${char.image}`}
                        alt={char.name} 
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </div>
                  ))
                ) : (
                  <div className="w-full py-8 flex items-center justify-center text-sm text-muted-foreground italic border border-dashed border-white/10 rounded-lg">
                    No recorded wins yet
                  </div>
                )}
              </div>
            </div>

            {/* Worse Than */}
            <div className="space-y-4 flex flex-col">
              <div className="flex items-center justify-between border-b border-red-500/20 pb-2">
                <h4 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Worse Than
                </h4>
                <span className="text-xs font-mono text-muted-foreground">{worseThan.length}</span>
              </div>
              <div className="flex flex-wrap gap-2 content-start">
                {worseThan.length > 0 ? (
                  worseThan.map(char => (
                    <div key={char.id} className="relative group w-12 h-12 rounded-md overflow-hidden transition-colors" title={char.name}>
                      <img 
                        src={char.circleImage ? `/Characters/Circles/${char.circleImage}` : `/Characters/${char.image}`}
                        alt={char.name} 
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </div>
                  ))
                ) : (
                  <div className="w-full py-8 flex items-center justify-center text-sm text-muted-foreground italic border border-dashed border-white/10 rounded-lg">
                    No recorded losses yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/40 flex justify-end">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto min-w-[100px]">Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

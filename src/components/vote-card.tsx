import { Character } from '@/lib/types'

import { NumberTicker } from './number-ticker'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ChevronUp, ChevronDown } from 'lucide-react'

interface VoteCardProps {
  character: Character
  onVote: () => void
  disabled?: boolean
  className?: string
  result?: 'win' | 'loss' | null
  variant?: 'default' | 'fullscreen'
  mirrored?: boolean
  rank?: number
  rankChange?: number | null
  tickerDuration?: number
}

export function VoteCard({ character, onVote, disabled, className, result, variant = 'default', mirrored = false, rank, rankChange, tickerDuration = 1200 }: VoteCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const isFullscreen = variant === 'fullscreen'

  return (
    <div 
      className={cn(
        "group relative w-full bg-card transition-all duration-300",
        !isFullscreen && "border border-border hover:border-primary/50 hover:shadow-[0_0_20px_rgba(234,179,8,0.1)]",
        isFullscreen && "h-full overflow-hidden border-r border-black/50",
        result === 'win' && !isFullscreen && "border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.2)]",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => !disabled && onVote()}
    >


        {/* Viewer Count Badge (SR) - Standard Card Only */}
        {!isFullscreen && (
            <div className="absolute bottom-24 right-2 z-20 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded-sm text-xs font-medium text-primary border border-border flex items-center gap-1 shadow-sm">
                {rank !== undefined && (
                  <>
                    <span className="text-white/60">#</span>
                    {rank}
                    <span className="mx-1 text-white/20">|</span>
                  </>
                )}
                <span className="text-white/60">SR</span>
                <NumberTicker value={Math.round(character.rating)} duration={tickerDuration} />
            </div>
        )}

      {/* Image Container */}
      <div className={cn(
        "w-full overflow-hidden relative bg-muted",
        !isFullscreen ? "aspect-video border-b border-border/50" : "absolute inset-0 h-full !aspect-auto"
      )}>
        <div className={cn("w-full h-full", mirrored && character.flippable && "scale-x-[-1]")}>
          <img 
            src={`/Characters/${character.image}`} 
            alt={character.name}
            className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
          />
        </div>
        {/* Image Overlay */}
        <div className={cn(
          "absolute inset-0 transition-opacity", 
          !isFullscreen ? "bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60 group-hover:opacity-40" : "bg-black/0 group-hover:bg-black/10"
        )} />
        
        {/* Rating Ticker Center Overlay */}
        {result && (
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center animate-in zoom-in fade-in duration-500">
             <div className={cn(
               "px-10 py-8 bg-black/70 backdrop-blur-xl rounded-2xl border border-white/10 flex flex-col items-center gap-2 transition-all duration-500",
               result === 'win' ? "shadow-[0_0_60px_rgba(74,222,128,0.25)]" : "shadow-[0_0_60px_rgba(239,68,68,0.25)]"
             )}>
                {rank !== undefined && (
                  <div className={cn(
                    "font-serif italic text-3xl mb-1 flex items-center gap-2",
                    result === 'win' ? "text-green-300" : "text-red-400"
                  )}>
                    <span className="text-xl opacity-60">RANK</span>
                    <span className="font-mono font-black">#{rank}</span>
                    {/* Rank Change Indicator */}
                    {rankChange !== null && rankChange !== undefined && rankChange !== 0 && (
                      <span className={cn(
                        "flex items-center text-xl font-bold animate-in slide-in-from-left-2 fade-in duration-300",
                        rankChange > 0 ? "text-green-400" : "text-red-400"
                      )}>
                        {rankChange > 0 ? (
                          <><ChevronUp className="w-5 h-5" />{rankChange}</>
                        ) : (
                          <><ChevronDown className="w-5 h-5" />{Math.abs(rankChange)}</>
                        )}
                      </span>
                    )}
                  </div>
                )}
                <div className={cn(
                    "font-mono font-black text-8xl flex items-center gap-3",
                    result === 'win' ? "text-green-400 drop-shadow-[0_0_20px_rgba(74,222,128,0.4)]" : "text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                )}>
                    <span className="text-4xl opacity-50 font-serif italic">SR</span>
                    <NumberTicker value={Math.round(character.rating)} duration={tickerDuration} />
                </div>
             </div>
          </div>
        )}

        {/* Play Button Overlay Effect */}
        <div className={cn(
            "absolute inset-0 flex items-center justify-center transition-all duration-300",
            isHovered && !disabled ? "opacity-100 bg-black/20" : "opacity-0"
        )}>
        </div>
      </div>

      {/* Content Body */}
      <div className={cn(
        "p-4 space-y-3 relative overflow-hidden flex flex-col justify-end",
        isFullscreen ? "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent pt-32 pb-12 items-center text-center" : ""
      )}>

        {/* Fullscreen Rating Display */}
        {isFullscreen && (
            <div className="flex flex-col items-center gap-1 mb-1 animate-in slide-in-from-bottom-2 fade-in duration-500 delay-100">
                 {rank !== undefined && (
                   <span className="text-white/40 font-serif italic text-base tracking-[0.2em] uppercase">
                     Rank #{rank}
                   </span>
                 )}
                 <div className="flex items-center gap-2">
                  <div className="h-[1px] w-8 bg-amber-500/50"></div>
                  <span className="text-amber-400 font-bold text-xl tracking-widest font-mono drop-shadow-md">
                      SR <NumberTicker value={Math.round(character.rating)} duration={tickerDuration} />
                  </span>
                  <div className="h-[1px] w-8 bg-amber-500/50"></div>
                 </div>
            </div>
        )}

        <h3 className={cn(
            "font-serif font-bold text-foreground leading-tight line-clamp-1 group-hover:text-primary transition-colors",
            isFullscreen ? "text-7xl shadow-black drop-shadow-2xl mb-2" : "text-lg"
        )}>
          {character.name}
        </h3>
        
        <div className={cn("flex items-center gap-2", isFullscreen && "opacity-60")}>
             {!isFullscreen && (
                 <div className="h-8 w-8 rounded-full overflow-hidden border border-border bg-muted shrink-0">
                      <img 
                        src={character.circleImage ? `/Characters/Circles/${character.circleImage}` : `/Characters/${character.image}`} 
                        className="w-full h-full object-cover opacity-80" 
                        alt="avatar" 
                      />
                 </div>
             )}
        </div>

        {/* Hover Action Line/Underline */}
        <div className="absolute bottom-0 left-0 h-[2px] bg-primary w-0 group-hover:w-full transition-all duration-500 ease-out" />
      </div>
    </div>
  )
}

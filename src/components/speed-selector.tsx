import { useSpeed, SpeedOption } from '@/lib/speed-context'
import { cn } from '@/lib/utils'
import { Gauge, Zap, Timer, FastForward } from 'lucide-react'

const speedOptions: { value: SpeedOption; label: string; icon: typeof Gauge }[] = [
  { value: 'slow', label: '0.5x', icon: Timer },
  { value: 'normal', label: '1x', icon: Gauge },
  { value: 'fast', label: '2x', icon: FastForward },
  { value: 'instant', label: '∞', icon: Zap },
]

export function SpeedSelector() {
  const { speed, setSpeed } = useSpeed()

  return (
    <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg p-1">
      {speedOptions.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setSpeed(value)}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
            speed === value
              ? "bg-primary/20 text-primary border border-primary/30 shadow-[0_0_10px_rgba(234,179,8,0.2)]"
              : "text-white/50 hover:text-white/80 hover:bg-white/5"
          )}
          title={`Animation speed: ${label}`}
        >
          <Icon className="w-3.5 h-3.5" />
          <span className="font-mono">{label}</span>
        </button>
      ))}
    </div>
  )
}

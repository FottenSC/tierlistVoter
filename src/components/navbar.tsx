import { Link, useLocation } from '@tanstack/react-router'
import { Swords, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Navbar() {
  const location = useLocation()

  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky top-0 z-50">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4 md:gap-8 w-full justify-between md:justify-start">
          <Link to="/" className="flex items-center gap-3 tracking-widest uppercase shrink-0">
             {/* Logo or Icon could go here */}
            <span className="text-lg md:text-xl font-serif font-bold text-primary tracking-[0.2em] border-r border-border pr-4 md:pr-6 py-1">
              ZOETROPE <span className="hidden sm:inline text-foreground">VOTER</span>
            </span>
          </Link>
          
          <div className="flex items-center gap-2 md:gap-4 text-xs md:text-base font-serif tracking-wider flex-1 md:flex-initial">
            <Link 
              to="/" 
              className={cn(
                "transition-all duration-300 hover:text-primary flex items-center gap-1.5 md:gap-2 uppercase font-bold px-2 md:px-3 py-1.5 md:py-2 rounded",
                location.pathname === '/' ? "text-primary scale-105" : "text-muted-foreground"
              )}
            >
              <Swords className="h-4 w-4 md:h-5 md:w-5" />
              Vote<span className="hidden sm:inline"> Area</span>
            </Link>
            <Link 
              to="/leaderboard" 
              className={cn(
                "transition-all duration-300 hover:text-primary flex items-center gap-1.5 md:gap-2 uppercase font-bold px-2 md:px-3 py-1.5 md:py-2 rounded",
                location.pathname === '/leaderboard' ? "text-primary scale-105" : "text-muted-foreground"
              )}
            >
              <Trophy className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">Your </span>Tierlist
            </Link>
          </div>
        </div>

      </div>
    </nav>
  )
}

import { Link, useLocation } from '@tanstack/react-router'
import { Trophy, Swords } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Navbar() {
  const location = useLocation()

  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky top-0 z-50">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-3 tracking-widest uppercase">
             {/* Logo or Icon could go here */}
            <span className="text-xl font-serif font-bold text-primary tracking-[0.2em] border-r border-border pr-6 py-1">ZOETROPE <span className="text-foreground">VOTER</span></span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6 text-sm font-serif tracking-wider">
            <Link 
              to="/" 
              className={cn(
                "transition-all duration-300 hover:text-primary flex items-center gap-2 uppercase text-xs font-bold",
                location.pathname === '/' ? "text-primary scale-105" : "text-muted-foreground"
              )}
            >
              <Swords className="h-4 w-4" />
              Vote Area
            </Link>
            <Link 
              to="/leaderboard" 
              className={cn(
                "transition-all duration-300 hover:text-primary flex items-center gap-2 uppercase text-xs font-bold",
                location.pathname === '/leaderboard' ? "text-primary scale-105" : "text-muted-foreground"
              )}
            >
              <Trophy className="h-4 w-4" />
              Your Tierlist
            </Link>
          </div>
        </div>

      </div>
    </nav>
  )
}

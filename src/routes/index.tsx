import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import confetti from "canvas-confetti";
import type { Character, Match } from "@/lib/types";
import { characters as initialCharacters } from "@/lib/characters";
import { calculateNewRatings } from "@/lib/glicko";
import { VoteCard } from "@/components/vote-card";
import { SpeedSelector } from "@/components/speed-selector";
import { useSpeed } from "@/lib/speed-context";
import { useMatch } from "@/lib/match-context";
import { cn } from "@/lib/utils";

// Global to track hydration across navigations
let hasHydratedGlobal = false;

// Helper to get persistence from localStorage
const getStoredCharacters = (): Array<Character> => {
  if (typeof window === "undefined") return initialCharacters;
  const stored = localStorage.getItem("characters-data");
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as Array<Character>;
      // Merge with initial characters to ensure new properties (like circleImage) are present
      return initialCharacters.map((initial) => {
        const found = parsed.find((p) => p.id === initial.id);
        if (found) {
          return { ...initial, ...found };
        }
        return initial;
      });
    } catch (e) {
      console.error("Failed to parse stored characters", e);
    }
  }
  return initialCharacters;
};

const saveCharacters = (chars: Array<Character>) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("characters-data", JSON.stringify(chars));
  }
};

const prefetchImages = (chars: [Character, Character]) => {
  chars.forEach((c) => {
    const img = new Image();
    img.src = `/Characters/${c.image}`;
  });
};

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      {
        title: 'Tierlist Voter',
      },
      {
        name: 'description',
        content: 'Vote on character matchups.',
      },
      {
        property: 'og:title',
        content: 'Tierlist Voter',
      },
      {
        property: 'og:description',
        content: 'Vote on character matchups.',
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
});

function Index() {
  const [characters, setCharacters] = useState<Array<Character>>(() => {
    if (hasHydratedGlobal) return getStoredCharacters();
    return [];
  });
  const [loading, setLoading] = useState(!hasHydratedGlobal);
  const [voteState, setVoteState] = useState<"idle" | "voting" | "success">(
    "idle",
  );
  const [lastResult, setLastResult] = useState<
    { winnerId: number; loserId: number } | null
  >(null);
  const [previousRanks, setPreviousRanks] = useState<{ [id: number]: number }>(
    {},
  );
  const [previousState, setPreviousState] = useState<{
    characters: Array<Character>;
    currentPair: [Character, Character];
    nextPair: [Character, Character] | null;
  } | null>(null);
  const { getTickerDuration, getTransitionDelay } = useSpeed();
  const {
    currentPair,
    setCurrentPair,
    nextPair,
    setNextPair,
    popNextPair,
    pushToQueue,
    queueProgress,
    isFinished,
  } = useMatch();

  useEffect(() => {
    if (isFinished) {
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) =>
        Math.random() * (max - min) + min;

      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        // since particles fall down, start a bit higher than random
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isFinished]);

  useEffect(() => {
    if (!hasHydratedGlobal) {
      const chars = getStoredCharacters();
      setCharacters(chars);
      hasHydratedGlobal = true;
      setLoading(false);
    }
  }, []);

  const handleVote = (winner: Character, loser: Character) => {
    if (voteState !== "idle" || !currentPair) return;

    // Save state for undo
    setPreviousState({
      characters: [...characters],
      currentPair: [...currentPair] as [Character, Character],
      nextPair: nextPair ? ([...nextPair] as [Character, Character]) : null,
    });

    // Store previous ranks before vote
    const sortedBefore = [...characters].sort((a, b) => b.rating - a.rating);
    const prevRanks = {
      [currentPair[0].id]:
        sortedBefore.findIndex((c) => c.id === currentPair[0].id) + 1,
      [currentPair[1].id]:
        sortedBefore.findIndex((c) => c.id === currentPair[1].id) + 1,
    };
    setPreviousRanks(prevRanks);

    setVoteState("voting");
    setLastResult({ winnerId: winner.id, loserId: loser.id });

    // Calculate new ratings
    const { winner: newWinner, loser: newLoser } = calculateNewRatings(
      winner,
      loser,
    );

    // Save match history
    const newMatch: Match = {
      winner_id: winner.id,
      loser_id: loser.id,
      timestamp: new Date().toISOString(),
    };

    try {
      const storedMatches = localStorage.getItem("match-history");
      const matches = storedMatches ? JSON.parse(storedMatches) : [];
      matches.push(newMatch);
      localStorage.setItem("match-history", JSON.stringify(matches));
    } catch (e) {
      console.error("Failed to save match history", e);
    }

    // Update local state and save to localStorage
    const updatedChars = characters.map((c) => {
      if (c.id === winner.id) {
        return {
          ...newWinner,
          vote_count: (winner as any).vote_count
            ? (winner as any).vote_count + 1
            : 1,
        } as Character;
      }
      if (c.id === loser.id) {
        return {
          ...newLoser,
          vote_count: (loser as any).vote_count
            ? (loser as any).vote_count + 1
            : 1,
        } as Character;
      }
      return c;
    });

    // Delay state update slightly so the result box mounts with the OLD rating first
    const updateDelay = Math.min(200, getTickerDuration() * 0.15);
    setTimeout(() => {
      setCharacters(updatedChars);
      saveCharacters(updatedChars);

      // Update the current pair with the new ratings so the ticker can animate
      const updatedPair: [Character, Character] = [
        updatedChars.find((c) => c.id === currentPair[0].id)!,
        updatedChars.find((c) => c.id === currentPair[1].id)!,
      ];
      setCurrentPair(updatedPair);
    }, updateDelay);

    // Use speed context for transition delay
    setTimeout(() => {
      setLastResult(null);
      setVoteState("idle");
      setPreviousRanks({});

      let currentNextPair = nextPair;
      if (!currentNextPair) {
        currentNextPair = popNextPair(updatedChars);
      }

      if (currentNextPair) {
        // Refresh data for the new pair from updatedChars
        const p1 = updatedChars.find((c) => c.id === currentNextPair[0].id) ||
          currentNextPair[0];
        const p2 = updatedChars.find((c) => c.id === currentNextPair[1].id) ||
          currentNextPair[1];

        setCurrentPair([p1, p2]);

        // Generate and prefetch the pair after that
        const newNext = popNextPair(updatedChars);
        setNextPair(newNext);
        if (newNext) {
          prefetchImages(newNext);
        }
      } else {
        setCurrentPair(null);
        setNextPair(null);
      }
    }, getTransitionDelay());
  };

  const handleUndo = () => {
    if (!previousState || voteState !== "idle") return;

    setCharacters(previousState.characters);
    saveCharacters(previousState.characters);
    try {
      const storedMatches = localStorage.getItem("match-history");
      if (storedMatches) {
        const matches = JSON.parse(storedMatches);
        matches.pop();
        localStorage.setItem("match-history", JSON.stringify(matches));
      }
    } catch (e) {
      console.error("Failed to undo match history", e);
    }

    // Restore queue state
    // If we had a nextPair in the current state that wasn't in the previous state,
    // it means it was popped from the queue. We need to push it back.
    if (nextPair && (!previousState.nextPair || nextPair[0].id !== previousState.nextPair[0].id)) {
      pushToQueue([nextPair[0].id, nextPair[1].id]);
    }

    setCurrentPair(previousState.currentPair);
    setNextPair(previousState.nextPair);
    setPreviousState(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (voteState !== "idle") return;

      if (!isFinished && currentPair) {
        if (e.key === "ArrowLeft") {
          handleVote(currentPair[0], currentPair[1]);
        } else if (e.key === "ArrowRight") {
          handleVote(currentPair[1], currentPair[0]);
        }
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        handleUndo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPair, voteState, handleVote, previousState, isFinished]);

  if (!currentPair && loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="h-[calc(100vh-4rem)] w-full flex flex-col items-center justify-center bg-background relative overflow-hidden">
        <div className="z-10 text-center space-y-8 p-8 max-w-2xl">
          <h1 className="text-6xl md:text-8xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-b from-[#fcd34d] to-[#b45309] drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)] tracking-widest">
            FINISHED
          </h1>
          <p className="text-xl md:text-2xl text-white/70 font-serif italic tracking-wide">
            You've completed all matches.
          </p>
          <div className="flex justify-center pt-8 gap-4">
            <button
              onClick={() => (window.location.href = "/leaderboard")}
              className="px-12 py-4 bg-primary/20 hover:bg-primary/30 border border-primary/50 text-primary font-serif uppercase tracking-widest transition-all rounded-lg backdrop-blur-sm pointer-events-auto text-lg"
            >
              View Tier List
            </button>
            {previousState && (
              <button
                onClick={handleUndo}
                className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/20 text-white/50 font-serif uppercase tracking-widest transition-all rounded-lg backdrop-blur-sm pointer-events-auto flex items-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Undo Last Match
              </button>
            )}
          </div>
        </div>

        {/* Background decorative elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />
        </div>
      </div>
    );
  }

  if (!currentPair) return null;

  const sortedChars = [...characters].sort((a, b) => b.rating - a.rating);
  const getRank = (id: number) => sortedChars.findIndex((c) => c.id === id) + 1;

  // Calculate rank change (positive = moved up, negative = moved down)
  const getRankChange = (id: number): number | null => {
    if (!previousRanks[id]) return null;
    const currentRank = getRank(id);
    return previousRanks[id] - currentRank; // positive means rank improved (went from lower # to higher #)
  };

  const tickerDuration = getTickerDuration();

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
          disabled={voteState !== "idle"}
          result={lastResult
            ? (lastResult.winnerId === currentPair[0].id ? "win" : "loss")
            : null}
          variant="fullscreen"
          className="h-full rounded-none border-none"
          mirrored={true}
          tickerDuration={tickerDuration}
        />
      </div>

      {/* Versus Text (Overlay) / Result Ticker */}
      <div className="absolute inset-0 z-20 pointer-events-none flex md:flex-col items-center justify-center gap-2 md:gap-2">
        <div className="w-20 md:w-[1px] h-[1px] md:h-40 bg-gradient-to-r md:bg-gradient-to-b from-transparent via-primary to-transparent opacity-80 shadow-[0_0_10px_rgba(234,179,8,0.5)]">
        </div>

        <div className="relative h-32 flex items-center justify-center">
          <span
            className={cn(
              "text-6xl md:text-8xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-b from-[#fcd34d] to-[#b45309] drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)] tracking-widest scale-125 transition-all duration-500",
              voteState !== "idle"
                ? "opacity-0 scale-150 rotate-12"
                : "opacity-100",
            )}
          >
            VS
          </span>
        </div>

        <div className="w-20 md:w-[1px] h-[1px] md:h-40 bg-gradient-to-r md:bg-gradient-to-b from-transparent via-primary to-transparent opacity-80 shadow-[0_0_10px_rgba(234,179,8,0.5)]">
        </div>
      </div>

      {/* Right Character */}
      <div className="flex-1 relative h-full">
        <VoteCard
          character={currentPair[1]}
          rank={getRank(currentPair[1].id)}
          rankChange={getRankChange(currentPair[1].id)}
          onVote={() => handleVote(currentPair[1], currentPair[0])}
          disabled={voteState !== "idle"}
          result={lastResult
            ? (lastResult.winnerId === currentPair[1].id ? "win" : "loss")
            : null}
          variant="fullscreen"
          className="h-full rounded-none border-none"
          tickerDuration={tickerDuration}
        />
      </div>

      {/* Global Bottom UI */}
      <div className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-6 z-30 pointer-events-none">
        <div
          className="hidden md:flex justify-center items-center gap-64 transition-opacity duration-500"
          style={{ opacity: voteState === "idle" ? 1 : 0 }}
        >
          <div className="px-3 py-1 bg-black/40 backdrop-blur-sm border border-white/20 rounded text-white/50 font-mono text-sm animate-bounce">
            ←
          </div>
          <div className="px-3 py-1 bg-black/40 backdrop-blur-sm border border-white/20 rounded text-white/50 font-mono text-sm animate-bounce">
            →
          </div>
        </div>

        <div
          className={cn(
            "hidden md:block text-center text-white/50 text-sm font-serif italic tracking-widest uppercase animate-pulse transition-opacity duration-500",
            voteState !== "idle" ? "opacity-0" : "opacity-100",
          )}
        >
          Select the better character or use keys
        </div>

        <div
          className={cn(
            "flex flex-col items-center gap-1 transition-opacity duration-500",
            voteState !== "idle" ? "opacity-0" : "opacity-100",
          )}
        >
          <div className="relative flex items-center justify-center">
            <div className="flex flex-col items-center gap-1">
              <div className="text-[10px] font-mono text-primary/40 uppercase tracking-[0.3em]">
                Matches Completed
              </div>
              <div className="text-xs font-serif text-white/30 tracking-widest uppercase">
                <span className="text-primary/60 font-bold">
                  {queueProgress.current}
                </span>
                <span className="mx-2">/</span>
                <span>{queueProgress.total}</span>
              </div>
            </div>

            {previousState && (
              <div className="absolute left-full ml-4">
                <button
                  onClick={handleUndo}
                  className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/40 hover:text-white/70 transition-all pointer-events-auto group"
                  title="Undo last match (Ctrl+Z)"
                >
                  <RotateCcw className="w-4 h-4 group-hover:rotate-[-45deg] transition-transform" />
                </button>
              </div>
            )}
          </div>
          <div className="w-32 h-0.5 bg-white/5 rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-primary/30 transition-all duration-500 ease-out"
              style={{
                width: `${
                  (queueProgress.current / queueProgress.total) * 100
                }%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

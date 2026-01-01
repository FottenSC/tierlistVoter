export interface Character {
  id: number
  name: string
  image: string
  circleImage?: string
  rating: number
  rd: number // Rating Deviation
  vol: number // Volatility
  last_vote_time?: string
  flippable: boolean
}

export interface Match {
  winner_id: number
  loser_id: number
  timestamp: string
}

export type VoteAction = 'win' | 'loss'

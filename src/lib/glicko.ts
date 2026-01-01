import { Character } from './types'

// Glicko-2 Constants
const TAU = 0.5
const EPSILON = 0.000001

const g = (phi: number) => {
  return 1 / Math.sqrt(1 + 3 * phi * phi / (Math.PI * Math.PI))
}

const E = (mu: number, mu_j: number, phi_j: number) => {
  return 1 / (1 + Math.exp(-g(phi_j) * (mu - mu_j)))
}

// Convert Rating to Glicko-2 scale
const scaleDown = (rating: number, rd: number) => {
  return {
    mu: (rating - 1500) / 173.7178,
    phi: rd / 173.7178
  }
}

// Convert Glicko-2 scale to Rating
const scaleUp = (mu: number, phi: number) => {
  return {
    rating: 173.7178 * mu + 1500,
    rd: 173.7178 * phi
  }
}

export const calculateNewRatings = (winner: Character, loser: Character) => {
  // 1. Convert to Glicko-2 scale
  let { mu: muW, phi: phiW } = scaleDown(winner.rating, winner.rd)
  let { mu: muL, phi: phiL } = scaleDown(loser.rating, loser.rd)
  
  // Winner calculations
  const gPhiL = g(phiL)
  const eW = E(muW, muL, phiL)
  const vW = 1 / (gPhiL * gPhiL * eW * (1 - eW))
  const deltaW = vW * gPhiL * (1 - eW)
  
  // Loser calculations
  const gPhiW = g(phiW)
  const eL = E(muL, muW, phiW)
  const vL = 1 / (gPhiW * gPhiW * eL * (1 - eL)) // Note: result is 0 for loser, so (0 - E)
  const deltaL = vL * gPhiW * (0 - eL)

  // Update Volatility (simplified for single match update)
  // For a true Glicko-2 implementation, we iterate to find new sigma. 
  // However, for single-match instantaneous updates, we can often simplify or assume constant volatility 
  // if strictly following the algorithm is too computationally heavy for client-side rapid updates.
  // But Glicko-2 specifically is about the volatility update.
  // Let's implement the iterative algorithm for sigma.
  
  const updateSigma = (_mu: number, phi: number, delta: number, sigma: number, v: number) => {
    const a = Math.log(sigma * sigma)
    const f = (x: number) => {
      const ex = Math.exp(x)
      const num1 = ex * (delta * delta - phi * phi - v - ex)
      const den1 = 2 * Math.pow(phi * phi + v + ex, 2)
      const term2 = (x - a) / (TAU * TAU)
      return (num1 / den1) - term2
    }

    let A = a
    let B
    if (delta * delta > phi * phi + v) {
      B = Math.log(delta * delta - phi * phi - v)
    } else {
      let k = 1
      while (f(a - k * TAU) < 0) {
        k++
      }
      B = a - k * TAU
    }
    
    let fA = f(A)
    let fB = f(B)
    
    while (Math.abs(B - A) > EPSILON) {
      const C: number = A + (A - B) * fA / (fB - fA)
      const fC = f(C)
      if (fC * fB < 0) {
        A = B
        fA = fB
      } else {
        fA = fA / 2
      }
      B = C
      fB = fC
    }
    
    return Math.exp(A / 2)
  }

  const newVolW = updateSigma(muW, phiW, deltaW, winner.vol, vW)
  const newVolL = updateSigma(muL, phiL, deltaL, loser.vol, vL) // Loser vol update logic is same, using their stats

  // Update Rating and RD
  const phiStarW = Math.sqrt(phiW * phiW + newVolW * newVolW)
  const newPhiW = 1 / Math.sqrt(1 / (phiStarW * phiStarW) + 1 / vW)
  const newMuW = muW + newPhiW * newPhiW * gPhiL * (1 - eW)

  const phiStarL = Math.sqrt(phiL * phiL + newVolL * newVolL)
  const newPhiL = 1 / Math.sqrt(1 / (phiStarL * phiStarL) + 1 / vL)
  const newMuL = muL + newPhiL * newPhiL * gPhiW * (0 - eL)

  // Convert back
  const wStats = scaleUp(newMuW, newPhiW)
  const lStats = scaleUp(newMuL, newPhiL)

  return {
    winner: {
      ...winner,
      rating: wStats.rating,
      rd: wStats.rd,
      vol: newVolW
    },
    loser: {
      ...loser,
      rating: lStats.rating,
      rd: lStats.rd,
      vol: newVolL
    }
  }
}

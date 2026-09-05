import type { PlayerBet, ScoreResult, StandingsEntry } from '../types'

// Points awarded per predicted team based on how many spots off its actual
// finishing position it was. Index 0 = exact match; 5+ off scores 0.
const POINTS_BY_DISTANCE = [6, 4, 3, 2, 1]

function pointsForDistance(distance: number): number {
  return POINTS_BY_DISTANCE[distance] ?? 0
}

// Points earned per predicted position, in predicted order (index 0 = the
// team predicted to finish 1st).
export function scorePredictionRows(predictedOrder: string[], actualOrder: string[]): number[] {
  return predictedOrder.map((teamId, predictedIndex) => {
    const actualIndex = actualOrder.indexOf(teamId)
    if (actualIndex === -1) return 0
    return pointsForDistance(Math.abs(predictedIndex - actualIndex))
  })
}

export function scoreAllPlayers(bets: PlayerBet[], standings: StandingsEntry[]): ScoreResult[] {
  const actualOrder = [...standings].sort((a, b) => a.position - b.position).map((s) => s.teamId)

  return bets
    .map((bet) => ({
      playerId: bet.playerId,
      playerName: bet.playerName,
      totalPoints: scorePredictionRows(bet.predictedOrder, actualOrder).reduce((a, b) => a + b, 0),
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints)
}

export interface Team {
  id: string
  name: string
}

export interface PlayerBet {
  playerId: string
  playerName: string
  /** Team ids in predicted finishing order, index 0 = predicted champion. */
  predictedOrder: string[]
}

export interface StandingsEntry {
  position: number
  teamId: string
  teamName: string
}

export interface ScoreResult {
  playerId: string
  playerName: string
  totalPoints: number
}

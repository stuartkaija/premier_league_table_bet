import { useEffect, useState } from 'react'
import LeagueTable from './components/LeagueTable'
import { BETS } from './data/bets'
import { TEAMS } from './data/teams'
import { scoreAllPlayers, scorePredictionRows } from './lib/scoring'
import type { StandingsEntry } from './types'

// Fetched at runtime (not bundled at build time) so the page always shows
// whatever fetch-standings.yml last committed, with no redeploy required.
const STANDINGS_URL =
  'https://raw.githubusercontent.com/stuartkaija/premier_league_table_bet/main/src/data/standings.json'

const teamNameById = new Map(TEAMS.map((team) => [team.id, team.name]))
const players = BETS.map((bet) => ({ playerId: bet.playerId, playerName: bet.playerName }))

function App() {
  const [standings, setStandings] = useState<StandingsEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(STANDINGS_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
        return res.json() as Promise<StandingsEntry[]>
      })
      .then(setStandings)
      .catch((err: Error) => setError(err.message))
  }, [])

  if (error) {
    return (
      <div id="app" className="mx-auto min-h-svh max-w-350 px-5 py-8">
        <p className="text-fg-strong">Couldn't load standings: {error}</p>
      </div>
    )
  }

  if (!standings) {
    return (
      <div id="app" className="mx-auto min-h-svh max-w-350 px-5 py-8">
        <p className="text-fg-strong">Loading standings…</p>
      </div>
    )
  }

  const sortedStandings = [...standings].sort((a, b) => a.position - b.position)
  const actualOrder = sortedStandings.map((entry) => entry.teamId)
  const betPoints = BETS.map((bet) => scorePredictionRows(bet.predictedOrder, actualOrder))

  const leagueTableRows = sortedStandings.map((entry, i) => ({
    position: entry.position,
    standingsTeamId: entry.teamId,
    standingsTeamName: entry.teamName,
    predictions: BETS.map((bet, betIndex) => {
      const teamId = bet.predictedOrder[i]
      return {
        playerId: bet.playerId,
        teamId,
        teamName: teamNameById.get(teamId) ?? teamId,
        points: betPoints[betIndex][i],
      }
    }),
  }))

  const rankings = scoreAllPlayers(BETS, standings)

  return (
    <div id="app" className="mx-auto min-h-svh max-w-350 px-5 py-8">
      <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="text-2xl font-medium text-fg-strong">THE PREMIER LEAGUE TABLE RACE 2026</h1>

        <section className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
          {rankings.map((result, index) => (
            <span key={result.playerId} className="whitespace-nowrap text-sm text-fg">
              <span className="font-medium text-fg-strong">
                {index + 1}. {result.playerName}
              </span>{' '}
              {result.totalPoints}
            </span>
          ))}
        </section>
      </header>

      <section className="overflow-x-auto">
        <LeagueTable players={players} rows={leagueTableRows} />
      </section>
    </div>
  )
}

export default App

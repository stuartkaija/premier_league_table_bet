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

const cellClass = 'border-b border-line px-3 py-2 text-left'
const headerClass = `${cellClass} font-medium text-fg-strong`

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
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-medium text-fg-strong">THE PREMIER LEAGUE TABLE RACE 2026</h1>
      </header>
      <div className="flex flex-col items-start gap-10 lg:flex-row">
        <section className="min-w-0 flex-4 overflow-x-auto">
          <LeagueTable players={players} rows={leagueTableRows} />
        </section>

        <section className="min-w-0 flex-1">
          <h2 className="mb-3 text-lg font-medium text-fg-strong">Ranking</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={headerClass}>#</th>
                <th className={headerClass}>Player</th>
                <th className={headerClass}>Points</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((result, index) => (
                <tr key={result.playerId}>
                  <td className={cellClass}>{index + 1}</td>
                  <td className={cellClass}>{result.playerName}</td>
                  <td className={cellClass}>{result.totalPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  )
}

export default App

import LeagueTable from './components/LeagueTable'
import { BETS } from './data/bets'
import standingsData from './data/standings.json'
import { TEAMS } from './data/teams'
import { scoreAllPlayers, scorePredictionRows } from './lib/scoring'
import type { StandingsEntry } from './types'

const standings = standingsData as StandingsEntry[]
const teamNameById = new Map(TEAMS.map((team) => [team.id, team.name]))

const sortedStandings = [...standings].sort((a, b) => a.position - b.position)
const actualOrder = sortedStandings.map((entry) => entry.teamId)

const players = BETS.map((bet) => ({ playerId: bet.playerId, playerName: bet.playerName }))
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

const cellClass = 'border-b border-line px-3 py-2 text-left'
const headerClass = `${cellClass} font-medium text-fg-strong`

function App() {
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

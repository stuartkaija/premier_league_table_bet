import TeamCell from './TeamCell'

interface PredictionCell {
  playerId: string
  teamId: string
  teamName: string
  points: number
}

interface LeagueTableRow {
  position: number
  standingsTeamId: string
  standingsTeamName: string
  predictions: PredictionCell[]
}

interface LeagueTableProps {
  players: { playerId: string; playerName: string }[]
  rows: LeagueTableRow[]
}

const cellClass = 'border-b border-line px-3 py-2 text-left'
const headerClass = `${cellClass} font-medium text-fg-strong`
// Right border on the Standings column separates actual results from predictions.
const standingsCellClass = `${cellClass} border-r`
const standingsHeaderClass = `${headerClass} border-r`

// outline (not border) so the hover effect doesn't shift table layout.
// Hovering any cell in a row outlines the whole row (hover bubbles up to the <tr> natively).
const rowHoverClass = 'hover:outline-1 hover:-outline-offset-1 hover:outline-blue-slate-500'

function LeagueTable({ players, rows }: LeagueTableProps) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          <th className={headerClass}>#</th>
          <th className={standingsHeaderClass}>Standings</th>
          {players.map((player) => (
            <th key={player.playerId} className={headerClass}>
              {player.playerName}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.position} className={rowHoverClass}>
            <td className={cellClass}>{row.position}</td>
            <td className={standingsCellClass}>
              <TeamCell teamId={row.standingsTeamId} teamName={row.standingsTeamName} />
            </td>
            {row.predictions.map((prediction) => (
              <td key={prediction.playerId} className={cellClass}>
                <TeamCell teamId={prediction.teamId} teamName={prediction.teamName} points={prediction.points} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default LeagueTable

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

// outline (not border) so the hover effect doesn't shift table layout.
// Hovering any cell in a row outlines the whole row (hover bubbles up to the <tr> natively).
const rowHoverClass = 'hover:outline-1 hover:-outline-offset-1 hover:outline-blue-slate-500'

// Cell tint by points earned for that pick, one accent hue per tier fading
// toward the blue-slate-based background as points drop. 0 = no tint.
// Light text on the tinted tiers keeps it readable against the accent color.
const SCORE_BG: Record<number, string> = {
  6: 'bg-spring-green-500/60 text-blue-slate-50',
  4: 'bg-turquoise-500/50 text-blue-slate-50',
  3: 'bg-strong-cyan-500/40 text-blue-slate-50',
  2: 'bg-blue-green-500/30 text-blue-slate-50',
  1: 'bg-blue-slate-500/20 text-blue-slate-50',
  0: '',
}

function LeagueTable({ players, rows }: LeagueTableProps) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          <th className={headerClass}>#</th>
          <th className={headerClass}>Standings</th>
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
            <td className={cellClass}>
              <TeamCell teamId={row.standingsTeamId} teamName={row.standingsTeamName} />
            </td>
            {row.predictions.map((prediction) => (
              <td key={prediction.playerId} className={`${cellClass} ${SCORE_BG[prediction.points]}`}>
                <TeamCell teamId={prediction.teamId} teamName={prediction.teamName} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default LeagueTable

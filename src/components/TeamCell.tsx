interface TeamCellProps {
  teamId: string
  teamName: string
  /** Points earned for this pick, if applicable — shown as a small superscript. */
  points?: number
}

function TeamCell({ teamId, teamName, points }: TeamCellProps) {
  return (
    <span className="flex w-full items-center justify-between gap-2">
      <span className="inline-flex items-center gap-2">
        <img
          src={`${import.meta.env.BASE_URL}logos/${teamId}.svg`}
          alt=""
          className="h-5 w-5 object-contain"
          onError={(event) => {
            event.currentTarget.style.display = 'none'
          }}
        />
        {teamName}
      </span>
      {points !== undefined && points > 0 && <sup className="text-fg">+{points}</sup>}
    </span>
  )
}

export default TeamCell

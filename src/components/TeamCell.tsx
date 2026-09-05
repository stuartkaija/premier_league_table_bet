interface TeamCellProps {
  teamId: string
  teamName: string
}

function TeamCell({ teamId, teamName }: TeamCellProps) {
  return (
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
  )
}

export default TeamCell

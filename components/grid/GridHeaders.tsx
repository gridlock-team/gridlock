interface GridHeadersProps {
  colNumbers: (number | null)[]  // 10 numbers for columns (null = not yet revealed)
  rowNumbers: (number | null)[]  // 10 numbers for rows
  teamHome: string
  teamAway: string
}

export function GridHeaders({ colNumbers, rowNumbers, teamHome, teamAway }: GridHeadersProps) {
  return (
    <>
      {/* Column header row */}
      <div className="flex mb-1">
        <div className="w-14" />
        <div className="text-center text-xs text-blue-400 uppercase tracking-widest w-full mb-1">
          ← {teamAway} →
        </div>
      </div>
      <div className="flex mb-1">
        <div className="w-14" />
        {colNumbers.map((n, i) => (
          <div key={i} className="flex-1 h-7 flex items-center justify-center text-sm font-bold text-blue-400 bg-blue-950 rounded mx-px">
            {n ?? '?'}
          </div>
        ))}
      </div>
    </>
  )
}

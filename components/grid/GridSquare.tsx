interface GridSquareProps {
  row: number
  col: number
  ownerName: string | null
  ownerId?: string | null
  isWinner: boolean
  isCurrentWinner: boolean
  isSelected?: boolean
  onClaim?: (row: number, col: number) => void
}

export function GridSquare({ row, col, ownerName, ownerId = null, isWinner, isCurrentWinner, isSelected = false, onClaim }: GridSquareProps) {
  const isClaimed = ownerName !== null || ownerId !== null
  const label = isCurrentWinner ? `Winner square at row ${row + 1}, column ${col + 1}` : `Square row ${row + 1}, column ${col + 1}`

  let className = 'flex-1 h-14 flex items-center justify-center text-xs rounded mx-px transition-all '

  if (isCurrentWinner) {
    className += 'bg-green-700 text-white font-bold ring-2 ring-green-400 shadow-lg shadow-green-500/50'
  } else if (isSelected) {
    className += 'bg-blue-700 text-white ring-2 ring-blue-300 shadow-md shadow-blue-500/40'
  } else if (isWinner) {
    className += 'bg-green-900 text-green-300'
  } else if (isClaimed) {
    className += 'bg-slate-700 text-slate-300 cursor-not-allowed'
  } else {
    className += 'bg-slate-800 text-slate-500 hover:bg-slate-600 cursor-pointer'
  }

  return (
    <button
      type="button"
      aria-label={label}
      disabled={isClaimed}
      className={className}
      onClick={() => onClaim?.(row, col)}
    >
      {isCurrentWinner ? `🏆 ${ownerName}` : (ownerName ?? '+')}
    </button>
  )
}

import type { PoolNumberEntry } from './numbers'

export interface WinnerPosition {
  row: number
  col: number
}

export function resolveWinner(
  homeScore: number,
  awayScore: number,
  poolNumbers: PoolNumberEntry[]
): WinnerPosition | null {
  if (poolNumbers.length < 20) return null

  const homeLastDigit = homeScore % 10
  const awayLastDigit = awayScore % 10

  const rowEntry = poolNumbers.find(e => e.axis === 'row' && e.number === homeLastDigit)
  const colEntry = poolNumbers.find(e => e.axis === 'col' && e.number === awayLastDigit)

  if (!rowEntry || !colEntry) return null

  return { row: rowEntry.position, col: colEntry.position }
}

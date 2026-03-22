import { describe, it, expect } from 'vitest'
import { resolveWinner } from '../../../lib/scoring/winner'
import type { PoolNumberEntry } from '../../../lib/scoring/numbers'

// Pool where row digit 4 is at position 1, col digit 9 is at position 8
const poolNumbers: PoolNumberEntry[] = [
  { axis: 'row', position: 0, number: 2 },
  { axis: 'row', position: 1, number: 4 },
  { axis: 'row', position: 2, number: 7 },
  { axis: 'row', position: 3, number: 0 },
  { axis: 'row', position: 4, number: 5 },
  { axis: 'row', position: 5, number: 1 },
  { axis: 'row', position: 6, number: 8 },
  { axis: 'row', position: 7, number: 3 },
  { axis: 'row', position: 8, number: 6 },
  { axis: 'row', position: 9, number: 9 },
  { axis: 'col', position: 0, number: 3 },
  { axis: 'col', position: 1, number: 7 },
  { axis: 'col', position: 2, number: 1 },
  { axis: 'col', position: 3, number: 5 },
  { axis: 'col', position: 4, number: 0 },
  { axis: 'col', position: 5, number: 8 },
  { axis: 'col', position: 6, number: 2 },
  { axis: 'col', position: 7, number: 6 },
  { axis: 'col', position: 8, number: 9 },
  { axis: 'col', position: 9, number: 4 },
]

describe('resolveWinner', () => {
  it('returns correct row and col position for matching scores', () => {
    // home_score=24 (last digit 4 → row pos 1), away_score=19 (last digit 9 → col pos 8)
    const result = resolveWinner(24, 19, poolNumbers)
    expect(result).toEqual({ row: 1, col: 8 })
  })

  it('uses last digit only, not full score', () => {
    // 14 and 9 have same last digits as 24 and 19
    const result = resolveWinner(14, 9, poolNumbers)
    expect(result).toEqual({ row: 1, col: 8 })
  })

  it('handles score of 0', () => {
    // home=0 (last digit 0 → row pos 3), away=0 (last digit 0 → col pos 4)
    const result = resolveWinner(0, 0, poolNumbers)
    expect(result).toEqual({ row: 3, col: 4 })
  })

  it('returns null if pool numbers are incomplete', () => {
    const result = resolveWinner(24, 19, [])
    expect(result).toBeNull()
  })
})

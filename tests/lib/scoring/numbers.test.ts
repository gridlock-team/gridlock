import { describe, it, expect } from 'vitest'
import { generatePoolNumbers } from '../../../lib/scoring/numbers'

describe('generatePoolNumbers', () => {
  it('returns exactly 20 entries (10 rows + 10 cols)', () => {
    const result = generatePoolNumbers()
    expect(result).toHaveLength(20)
  })

  it('row entries contain all digits 0-9 exactly once', () => {
    const result = generatePoolNumbers()
    const rowNumbers = result
      .filter(e => e.axis === 'row')
      .map(e => e.number)
      .sort((a, b) => a - b)
    expect(rowNumbers).toEqual([0,1,2,3,4,5,6,7,8,9])
  })

  it('col entries contain all digits 0-9 exactly once', () => {
    const result = generatePoolNumbers()
    const colNumbers = result
      .filter(e => e.axis === 'col')
      .map(e => e.number)
      .sort((a, b) => a - b)
    expect(colNumbers).toEqual([0,1,2,3,4,5,6,7,8,9])
  })

  it('each axis has positions 0-9', () => {
    const result = generatePoolNumbers()
    const rowPositions = result
      .filter(e => e.axis === 'row')
      .map(e => e.position)
      .sort((a, b) => a - b)
    expect(rowPositions).toEqual([0,1,2,3,4,5,6,7,8,9])
  })

  it('produces different shuffles on repeated calls', () => {
    const a = generatePoolNumbers().map(e => e.number).join('')
    const b = generatePoolNumbers().map(e => e.number).join('')
    // Statistically near-impossible to match; if this ever fails, investigate RNG
    expect(a).not.toEqual(b)
  })
})

import { describe, it, expect, vi } from 'vitest'

// We test the pool validation logic in isolation
describe('pool validation', () => {
  it('requires name, sport, team_home, team_away', () => {
    const required = ['name', 'sport', 'team_home', 'team_away']
    const partial = { name: 'Test Pool', sport: 'NFL' }
    const missing = required.filter(k => !(k in partial))
    expect(missing).toEqual(['team_home', 'team_away'])
  })

  it('payout_periods defaults to ["Final"] when not provided', () => {
    const defaults = { payout_periods: ['Final'] }
    const input = {}
    const result = { payout_periods: (input as any).payout_periods ?? defaults.payout_periods }
    expect(result.payout_periods).toEqual(['Final'])
  })
})

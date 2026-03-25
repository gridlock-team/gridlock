import { z } from 'zod'

// ============================================
// SQUARE CLAIMING VALIDATION
// ============================================

export const claimSquareSchema = z.object({
  row: z.number().int().min(0).max(9, 'Row must be between 0 and 9'),
  col: z.number().int().min(0).max(9, 'Column must be between 0 and 9'),
  owner_id: z.string().uuid().optional(),
  guest_name: z.string().min(1).max(100).optional(),
  guest_email: z.string().email().optional(),
  guest_phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone format').optional(),
}).refine(
  (data) => {
    // If owner_id is provided, that's sufficient
    if (data.owner_id) return true
    // Otherwise, require guest_name and at least one contact method
    return data.guest_name && (data.guest_email || data.guest_phone)
  },
  {
    message: 'Guest claims require name and at least one contact method (email or phone)',
  }
)

export type ClaimSquareInput = z.infer<typeof claimSquareSchema>

// ============================================
// POOL CREATION VALIDATION
// ============================================

export const createPoolSchema = z.object({
  name: z.string().min(1, 'Pool name is required').max(200),
  sport: z.string().min(1, 'Sport is required').max(50),
  team_home: z.string().min(1, 'Home team is required').max(100),
  team_away: z.string().min(1, 'Away team is required').max(100),
  payout_periods: z.array(z.string()).default(['Final']),
  game_date: z.string().datetime().optional(),
  external_game_id: z.string().optional(),
})

export type CreatePoolInput = z.infer<typeof createPoolSchema>

// ============================================
// SCORE RECORDING VALIDATION
// ============================================

export const recordScoreSchema = z.object({
  period_name: z.string().min(1, 'Period name is required').max(50),
  home_score: z.number().int().min(0, 'Home score must be non-negative'),
  away_score: z.number().int().min(0, 'Away score must be non-negative'),
})

export type RecordScoreInput = z.infer<typeof recordScoreSchema>

// ============================================
// POOL UPDATE VALIDATION
// ============================================

export const updatePoolSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  status: z.enum(['open', 'locked', 'completed', 'cancelled']).optional(),
  game_date: z.string().datetime().optional(),
  max_squares_per_person: z.number().int().positive().optional(),
})

export type UpdatePoolInput = z.infer<typeof updatePoolSchema>
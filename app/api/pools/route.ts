import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createPoolSchema } from '@/lib/validations/api-schemas'
import { ZodError } from 'zod'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get organizer user record
    const { data: organizer } = await supabase
      .from('users')
      .select('id, role')
      .eq('auth_id', user.id)
      .single()

    if (!organizer || !['admin', 'organizer'].includes(organizer.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    // Validate with Zod
    const validationResult = createPoolSchema.safeParse(body)
    
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }))
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: errors 
      }, { status: 400 })
    }

    const poolData = validationResult.data

    const { data: pool, error } = await supabase
      .from('pools')
      .insert({
        ...poolData,
        organizer_id: organizer.id,
        status: 'open',
      })
      .select()
      .single()

    if (error) {
      console.error('Pool creation error:', error)
      return NextResponse.json({ 
        error: 'Failed to create pool' 
      }, { status: 500 })
    }

    return NextResponse.json(pool, { status: 201 })
    
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.issues 
      }, { status: 400 })
    }
    
    console.error('Unexpected error in POST /api/pools:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

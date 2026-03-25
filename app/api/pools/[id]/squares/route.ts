import { createClient } from '@/lib/supabase/server'
import { generatePoolNumbers } from '@/lib/scoring/numbers'
import { sendSms } from '@/lib/notifications/sms'
import { sendEmail } from '@/lib/notifications/email'
import { numbersRevealMessage } from '@/lib/notifications/messages'
import { NextResponse } from 'next/server'
import { claimSquareSchema } from '@/lib/validations/api-schemas'
import { ZodError } from 'zod'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Parse and validate request body with Zod
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    // Validate with Zod schema
    const validationResult = claimSquareSchema.safeParse(body)
    
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

    const { row, col, guest_name, guest_email, guest_phone, owner_id } = validationResult.data

    // Get authenticated user (if any)
    const { data: { user } } = await supabase.auth.getUser()

    // Authorization: If owner_id is provided, verify it matches authenticated user
    if (owner_id) {
      if (!user) {
        return NextResponse.json({ 
          error: 'Authentication required to claim as registered user' 
        }, { status: 401 })
      }
      
      const { data: userRecord } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single()
      
      if (!userRecord || userRecord.id !== owner_id) {
        return NextResponse.json({ 
          error: 'Cannot claim square for another user' 
        }, { status: 403 })
      }
    }

    // Check pool exists and is open
    const { data: pool, error: poolError } = await supabase
      .from('pools')
      .select('id, status')
      .eq('id', id)
      .single()

    if (poolError || !pool) {
      return NextResponse.json({ error: 'Pool not found' }, { status: 404 })
    }

    if (pool.status !== 'open') {
      return NextResponse.json({ 
        error: 'Pool is not open for claiming' 
      }, { status: 409 })
    }

    // Attempt to claim the square
    const { data: square, error } = await supabase
      .from('squares')
      .insert({ 
        pool_id: id, 
        row, 
        col, 
        owner_id, 
        guest_name, 
        guest_email, 
        guest_phone 
      })
      .select()
      .single()

    if (error) {
      console.error('Square claim error:', error)
      return NextResponse.json({ 
        error: 'Square already claimed or invalid request' 
      }, { status: 409 })
    }

    // Check if all 100 squares are now claimed
    const { count } = await supabase
      .from('squares')
      .select('*', { count: 'exact', head: true })
      .eq('pool_id', id)

    if (count === 100) {
      try {
        const entries = generatePoolNumbers()
        
        await supabase.from('pool_numbers').insert(
          entries.map(e => ({ pool_id: id, ...e }))
        )
        
        await supabase.from('pools').update({ status: 'locked' }).eq('id', id)

        // Send notifications (async, non-blocking)
        sendNumberRevealNotifications(supabase, id, entries).catch(error => {
          console.error('Failed to send number reveal notifications:', error)
        })
      } catch (lockError) {
        console.error('Error locking pool and generating numbers:', lockError)
      }
    }

    return NextResponse.json(square, { status: 201 })
    
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.issues 
      }, { status: 400 })
    }
    
    console.error('Unexpected error in POST /api/pools/[id]/squares:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// Helper function to send notifications after pool is locked
async function sendNumberRevealNotifications(
  supabase: any,
  poolId: string,
  entries: Array<{ axis: 'row' | 'col'; position: number; number: number }>
) {
  const { data: allSquares } = await supabase
    .from('squares')
    .select('row, col, guest_name, guest_email, guest_phone, users(display_name, email, phone)')
    .eq('pool_id', poolId)

  const { data: poolData } = await supabase
    .from('pools')
    .select('team_home, team_away')
    .eq('id', poolId)
    .single()

  if (!poolData || !allSquares) {
    console.error('Missing pool or squares data for notifications')
    return
  }

  const rowNums = entries.filter(e => e.axis === 'row')
  const colNums = entries.filter(e => e.axis === 'col')

  const notificationPromises = allSquares.map(async (sq: any) => {
    const rowNum = rowNums.find(n => n.position === sq.row)?.number
    const colNum = colNums.find(n => n.position === sq.col)?.number

    if (rowNum === undefined || colNum === undefined) {
      console.error(`Missing numbers for square at row ${sq.row}, col ${sq.col}`)
      return
    }

    const msg = numbersRevealMessage(poolData.team_home, poolData.team_away, rowNum, colNum)
    const phone = sq.guest_phone ?? sq.users?.phone
    const email = sq.guest_email ?? sq.users?.email

    const promises = []
    if (phone) {
      promises.push(
        sendSms({ to: phone, body: msg }).catch(err => 
          console.error(`SMS failed for ${phone}:`, err)
        )
      )
    }
    if (email) {
      promises.push(
        sendEmail({ to: email, subject: 'GridLock — Numbers Revealed!', text: msg }).catch(err =>
          console.error(`Email failed for ${email}:`, err)
        )
      )
    }

    return Promise.all(promises)
  })

  await Promise.allSettled(notificationPromises)
}

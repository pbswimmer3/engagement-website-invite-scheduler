import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createAdminClient()

    const { data: guests, error } = await supabase
      .from('guests')
      .select('id, first_name, last_name, email, invitation_group, rsvp_status, invite_sent_at')
      .order('invitation_group', { nullsFirst: false })
      .order('first_name')

    if (error) throw error

    // Group guests by invitation_group (solo guests get their own group keyed by id)
    const groups: Record<string, typeof guests> = {}

    for (const guest of guests ?? []) {
      const key = guest.invitation_group ?? `solo_${guest.id}`
      if (!groups[key]) groups[key] = []
      groups[key].push(guest)
    }

    return NextResponse.json({ groups })
  } catch (err) {
    console.error('Fetch guests error:', err)
    return NextResponse.json({ error: 'Failed to fetch guests' }, { status: 500 })
  }
}

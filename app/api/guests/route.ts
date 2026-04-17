import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { INVITE_GROUPS, getGmailCredentialsForGroup } from '@/lib/email-template'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createAdminClient()

    const { data: guests, error } = await supabase
      .from('guests')
      .select('id, first_name, last_name, email, invitation_group, invite_group, rsvp_status, invite_sent_at')
      .order('invite_group', { nullsFirst: false })
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

    // Sender Gmail address per invite group (addresses only — never expose app
    // passwords to the client). Falls back to the shared GMAIL_USER if no
    // group-specific sender is configured.
    const senderEmails: Record<string, string | null> = {}
    for (const group of INVITE_GROUPS) {
      senderEmails[group] = getGmailCredentialsForGroup(group).user ?? null
    }

    return NextResponse.json(
      { groups, senderEmails },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  } catch (err) {
    console.error('Fetch guests error:', err)
    return NextResponse.json({ error: 'Failed to fetch guests' }, { status: 500 })
  }
}

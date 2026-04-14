import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { generateEmailHTML } from '@/lib/email-template'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const ids = req.nextUrl.searchParams.get('ids')?.split(',') ?? []

    if (ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: members, error } = await supabase
      .from('guests')
      .select('id, first_name, last_name, email, invite_group')
      .in('id', ids)

    if (error || !members || members.length === 0) {
      return NextResponse.json({ error: 'Guests not found' }, { status: 404 })
    }

    const inviteGroup = members.find((m) => m.invite_group)?.invite_group ?? null

    const websiteUrl = process.env.WEBSITE_URL || 'https://your-site.vercel.app'
    const websitePassword = process.env.WEBSITE_PASSWORD || 'Forever2026'
    const bgImageUrl = `${websiteUrl}/assets/bg-main.jpeg`

    const html = generateEmailHTML(members, websiteUrl, websitePassword, bgImageUrl, inviteGroup)

    return NextResponse.json({ html })
  } catch (err) {
    console.error('Preview error:', err)
    return NextResponse.json({ error: 'Failed to generate preview' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { ensureAbsoluteUrl, generateEmailHTML, getFaqUrl } from '@/lib/email-template'

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
    // Background image is hosted by this scheduler app (public/bg-main.jpeg),
    // so point at this app's own origin rather than the guest-facing
    // WEBSITE_URL (which lives on a different domain and does not serve the
    // file).
    const bgImageUrl = `${req.nextUrl.origin}/bg-main.jpeg`
    const faqUrl = getFaqUrl() || ensureAbsoluteUrl(websiteUrl)

    const html = generateEmailHTML(members, websiteUrl, bgImageUrl, inviteGroup, faqUrl)

    return NextResponse.json({ html })
  } catch (err) {
    console.error('Preview error:', err)
    return NextResponse.json({ error: 'Failed to generate preview' }, { status: 500 })
  }
}

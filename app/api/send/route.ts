import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { createAdminClient } from '@/lib/supabase'
import { generateEmailHTML, generateSubject } from '@/lib/email-template'

export async function POST(req: NextRequest) {
  try {
    const { groupKey, memberIds } = await req.json()

    if (!groupKey || !memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json({ error: 'Missing group data' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Fetch the group members
    const { data: members, error } = await supabase
      .from('guests')
      .select('id, first_name, last_name, email')
      .in('id', memberIds)

    if (error || !members || members.length === 0) {
      return NextResponse.json({ error: 'No guests found' }, { status: 404 })
    }

    // Collect emails (skip nulls)
    const emails = members
      .map((m) => m.email)
      .filter((e): e is string => !!e)

    if (emails.length === 0) {
      return NextResponse.json({ error: 'No email addresses in this group' }, { status: 400 })
    }

    // Build the email
    const websiteUrl = process.env.WEBSITE_URL || 'https://your-site.vercel.app'
    const websitePassword = process.env.WEBSITE_PASSWORD || 'Forever2026'
    const bgImageUrl = `${websiteUrl}/assets/bg-main.jpeg`

    const html = generateEmailHTML(members, websiteUrl, websitePassword, bgImageUrl)
    const subject = generateSubject(members)

    // Create Gmail transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })

    // Send with all recipients BCC'd
    await transporter.sendMail({
      from: `"Aanya & Prad" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,  // send to yourself
      bcc: emails,                  // all group members BCC'd
      subject,
      html,
    })

    // Mark guests as invite_sent
    const now = new Date().toISOString()
    await supabase
      .from('guests')
      .update({ invite_sent_at: now })
      .in('id', memberIds)

    return NextResponse.json({ success: true, sentTo: emails })
  } catch (err) {
    console.error('Send email error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to send email' },
      { status: 500 }
    )
  }
}

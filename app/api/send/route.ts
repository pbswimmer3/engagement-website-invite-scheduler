import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { createAdminClient } from '@/lib/supabase'
import {
  generateEmailHTML,
  generateSubject,
  getFaqUrl,
  getGmailCredentialsForGroup,
  getSenderNameForGroup,
  normalizeInviteGroup,
} from '@/lib/email-template'

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
      .select('id, first_name, last_name, email, invite_group')
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

    // All members of an invitation group should share the same invite_group;
    // use the first member's value to pick the template.
    const inviteGroup = members.find((m) => m.invite_group)?.invite_group ?? null

    // Build the email
    const websiteUrl = process.env.WEBSITE_URL || 'https://your-site.vercel.app'
    const bgImageUrl = `${websiteUrl}/assets/bg-main.jpeg`
    const faqUrl = getFaqUrl() || websiteUrl

    const normalizedGroup = normalizeInviteGroup(inviteGroup)
    const html = generateEmailHTML(members, websiteUrl, bgImageUrl, inviteGroup, faqUrl)
    const subject = generateSubject(members)
    const senderName = getSenderNameForGroup(normalizedGroup)

    // Pick the Gmail sender account for this invite group (Praanya / Biswas /
    // Jain each have their own GMAIL_USER_* / GMAIL_APP_PASSWORD_* env vars).
    const { user: gmailUser, pass: gmailPass } = getGmailCredentialsForGroup(normalizedGroup)

    if (!gmailUser || !gmailPass) {
      return NextResponse.json(
        { error: 'Gmail credentials are not configured for this invite group' },
        { status: 500 }
      )
    }

    // Create Gmail transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    })

    // Send with all recipients BCC'd
    await transporter.sendMail({
      from: `"${senderName}" <${gmailUser}>`,
      to: gmailUser,   // send to the sender account
      bcc: emails,     // all group members BCC'd
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

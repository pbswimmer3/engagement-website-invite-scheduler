import { NextRequest, NextResponse } from 'next/server'

async function sha256Hex(text: string): Promise<string> {
  const encoded = new TextEncoder().encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function POST(req: NextRequest) {
  const { password, from } = await req.json()

  const sitePassword = process.env.SITE_PASSWORD
  if (!sitePassword) {
    return NextResponse.json({ error: 'No password configured' }, { status: 500 })
  }

  if (password !== sitePassword) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }

  const token = await sha256Hex(sitePassword)
  const redirectTo = typeof from === 'string' && from.startsWith('/') ? from : '/'

  const response = NextResponse.json({ ok: true, redirectTo })
  response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
  return response
}

import { NextRequest, NextResponse } from 'next/server'

async function sha256Hex(text: string): Promise<string> {
  const encoded = new TextEncoder().encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Let the login page and its API through unconditionally
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  const sitePassword = process.env.SITE_PASSWORD
  if (!sitePassword) {
    // SITE_PASSWORD env var is missing. Log loudly and still redirect
    // to /login so the gate is visible rather than silently bypassed.
    console.warn(
      '[middleware] SITE_PASSWORD env var is not set — redirecting to /login anyway. ' +
        'Add SITE_PASSWORD in Vercel → Project Settings → Environment Variables ' +
        'for the Production environment, then redeploy.'
    )
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    loginUrl.searchParams.set('setup', '1')
    return NextResponse.redirect(loginUrl)
  }

  const expectedToken = await sha256Hex(sitePassword)
  const cookieToken = request.cookies.get('auth_token')?.value

  if (cookieToken !== expectedToken) {
    console.log(`[middleware] no/invalid auth cookie for ${pathname} — redirecting to /login`)
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

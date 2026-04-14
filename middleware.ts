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
    // No password configured — allow access (dev convenience)
    return NextResponse.next()
  }

  const expectedToken = await sha256Hex(sitePassword)
  const cookieToken = request.cookies.get('auth_token')?.value

  if (cookieToken !== expectedToken) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

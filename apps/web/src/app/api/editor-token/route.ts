import { NextResponse, type NextRequest } from 'next/server'

/**
 * GET /api/editor-token?token=xxx
 *
 * Validates the share token and sets an HttpOnly cookie, then redirects to /.
 * Used by the share URL flow: the public page detects ?editor_token= in the
 * query string, calls this endpoint, and reloads without the query param.
 *
 * GET /api/editor-token/validate
 * Returns 200 if the editor_token cookie is valid, 401 otherwise.
 */
export async function GET(request: NextRequest) {
  const { searchParams, pathname } = new URL(request.url)

  // ── Validate sub-route ────────────────────────────────────────────────────
  if (pathname.endsWith('/validate')) {
    const cookieToken = request.cookies.get('editor_token')?.value
    const secret = process.env.EDITOR_SHARE_TOKEN
    if (secret && cookieToken === secret) {
      return NextResponse.json({ ok: true })
    }
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  // ── Set-cookie flow ───────────────────────────────────────────────────────
  const token = searchParams.get('token') ?? ''
  const secret = process.env.EDITOR_SHARE_TOKEN

  if (!secret || token !== secret) {
    return new Response('Accès refusé', { status: 403 })
  }

  const redirectTo = searchParams.get('redirect') ?? '/'
  const response = NextResponse.redirect(new URL(redirectTo, request.url))

  response.cookies.set('editor_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 86400,
    secure: process.env.NODE_ENV === 'production',
  })

  return response
}

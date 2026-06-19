import { NextResponse, type NextRequest } from 'next/server'

/**
 * GET /api/editor-token/validate
 *
 * Returns 200 { ok: true } when the editor_token HttpOnly cookie is valid.
 * Used by PublicAdminFAB to detect share-link access without reading document.cookie
 * (which cannot see HttpOnly cookies on the client).
 */
export async function GET(request: NextRequest) {
  const cookieToken = request.cookies.get('editor_token')?.value
  const secret = process.env.EDITOR_SHARE_TOKEN

  if (secret && cookieToken === secret) {
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ ok: false }, { status: 401 })
}

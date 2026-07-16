import { NextResponse, type NextRequest } from 'next/server'

/**
 * GET /api/editor-token/share-url
 *
 * Returns the shareable editor URL for authenticated admins or existing editor-token holders.
 * The URL contains the EDITOR_SHARE_TOKEN as a query param; visiting it sets an HttpOnly
 * cookie via /api/editor-token, enabling the PublicAdminFAB for that browser session.
 *
 * Response: { url: "https://lenue.paris/?editor_token=TOKEN", token: "TOKEN" }
 * (storefront — not /admin; editor_token does not log into Payload admin)
 */
export async function GET(request: NextRequest) {
  const payloadToken = request.cookies.get('payload-token')?.value
  const editorToken = request.cookies.get('editor_token')?.value
  const secret = process.env.EDITOR_SHARE_TOKEN

  const isAdmin = !!payloadToken
  const isEditorHolder = !!(secret && editorToken === secret)

  if (!isAdmin && !isEditorHolder) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  if (!secret) {
    return NextResponse.json(
      { error: 'EDITOR_SHARE_TOKEN non configuré dans apps/web/.env' },
      { status: 503 },
    )
  }

  const origin = new URL(request.url).origin
  return NextResponse.json({
    url: `${origin}/?editor_token=${encodeURIComponent(secret)}&lp_assistant=1`,
    token: secret,
  })
}

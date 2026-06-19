import { cookies } from 'next/headers'
import { draftMode } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const payloadToken = cookieStore.get('payload-token')?.value
  const editorToken = cookieStore.get('editor_token')?.value
  const isAuthorized =
    !!payloadToken ||
    (!!editorToken && editorToken === process.env.EDITOR_SHARE_TOKEN)

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({})) as { action?: string }
  const dm = await draftMode()

  if (body.action === 'disable') {
    dm.disable()
  } else {
    dm.enable()
  }

  return NextResponse.json({ ok: true, enabled: body.action !== 'disable' })
}

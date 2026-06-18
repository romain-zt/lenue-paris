import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const path = searchParams.get("path");
  const previewSecret = searchParams.get("previewSecret");

  if (process.env.PREVIEW_SECRET && previewSecret !== process.env.PREVIEW_SECRET) {
    return new Response("Invalid preview secret", { status: 403 });
  }

  if (!path || !path.startsWith("/")) {
    return new Response("Missing path", { status: 400 });
  }

  const draft = await draftMode();
  draft.enable();

  redirect(path);
}

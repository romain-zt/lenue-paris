import { NextResponse } from "next/server";

export function seedAuthFailure(request: Request): NextResponse | null {
  if (!process.env.SEED_SECRET) {
    return NextResponse.json(
      { error: "Seed disabled — set SEED_SECRET in environment" },
      { status: 503 },
    );
  }

  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ")
    ? auth.slice("Bearer ".length).trim()
    : "";

  if (!token || token !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

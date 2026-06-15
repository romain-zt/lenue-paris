import { NextResponse } from "next/server";
import { seed } from "../../../seed";

export async function GET(request: Request) {
  const secret = process.env.SEED_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  await seed();
  return NextResponse.json({ message: "Seed completed" }, { status: 200 });
}

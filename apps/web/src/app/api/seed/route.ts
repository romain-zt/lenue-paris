import { NextResponse } from "next/server";
import { seedAuthFailure } from "../../../lib/seed-api-auth";
import { seed } from "../../../seed";

async function runSeed(request: Request) {
  const authFailure = seedAuthFailure(request);
  if (authFailure) return authFailure;

  await seed();
  return NextResponse.json({ message: "Seed completed" }, { status: 200 });
}

export async function GET(request: Request) {
  return runSeed(request);
}

export async function POST(request: Request) {
  return runSeed(request);
}

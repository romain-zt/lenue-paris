import { NextResponse } from "next/server";
import { seed } from "../../../seed";

export async function GET() {
  await seed();
  return NextResponse.json({ message: "Seed completed" }, { status: 200 });
}

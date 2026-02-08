import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/db-store";

export async function GET() {
  const leaderboard = await getLeaderboard(10);
  return NextResponse.json({ leaderboard });
}

import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/store";

export async function GET() {
  const leaderboard = getLeaderboard(10);
  return NextResponse.json({ leaderboard });
}

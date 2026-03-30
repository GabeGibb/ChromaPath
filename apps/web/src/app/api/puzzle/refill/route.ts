import { kv } from "@vercel/kv";
import { generateBoardParallel } from "@/shared";
import { NextResponse } from "next/server";

const QUEUE_SIZE = 10;

// All board sizes the mobile app uses
const BOARD_SIZES = [
  { width: 5, height: 5 },
  { width: 6, height: 6 },
  { width: 7, height: 7 },
  { width: 8, height: 8 },
  { width: 9, height: 9 },
  { width: 10, height: 10 },
  { width: 11, height: 11 },
  { width: 12, height: 12 },
  { width: 13, height: 13 },
  { width: 14, height: 14 },
  { width: 15, height: 15 },
  { width: 15, height: 16 },
  { width: 15, height: 17 },
  { width: 15, height: 18 },
  { width: 15, height: 19 },
  { width: 15, height: 20 },
];

function kvKey(width: number, height: number) {
  return `boards:${width}x${height}`;
}

// GET — cron-triggered refill of all queues
export async function GET() {
  try {
    const results: Record<string, { had: number; added: number }> = {};

    for (const { width, height } of BOARD_SIZES) {
      const key = kvKey(width, height);
      const current = await kv.llen(key);
      const needed = Math.max(0, QUEUE_SIZE - current);

      if (needed > 0) {
        for (let i = 0; i < needed; i++) {
          const board = await generateBoardParallel(width, height, 4);
          await kv.rpush(key, board);
        }
      }

      results[`${width}x${height}`] = { had: current, added: needed };
    }

    return NextResponse.json({
      ok: true,
      refilled: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Refill error:", error);
    return NextResponse.json(
      {
        error: "Refill failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

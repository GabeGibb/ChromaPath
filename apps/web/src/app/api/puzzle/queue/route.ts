import { kv } from "@vercel/kv";
import {
  generateBoardParallel,
  MIN_BOARD_WIDTH,
  MIN_BOARD_HEIGHT,
  MAX_BOARD_WIDTH,
  MAX_BOARD_HEIGHT,
} from "@/shared";
import { NextRequest, NextResponse } from "next/server";

const QUEUE_SIZE = 10; // boards per size to keep in queue
const LOW_THRESHOLD = 3; // refill when below this

function kvKey(width: number, height: number) {
  return `boards:${width}x${height}`;
}

// GET — pop a board from the queue
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const width = parseInt(searchParams.get("width") || "5");
    const height = parseInt(searchParams.get("height") || "5");

    if (
      width < MIN_BOARD_WIDTH ||
      width > MAX_BOARD_WIDTH ||
      height < MIN_BOARD_HEIGHT ||
      height > MAX_BOARD_HEIGHT
    ) {
      return NextResponse.json(
        { error: "Invalid board dimensions" },
        { status: 400 }
      );
    }

    const key = kvKey(width, height);

    // Pop a board from the list
    const board = await kv.lpop(key);

    if (board) {
      // Check remaining queue length, refill in background if low
      const remaining = await kv.llen(key);
      if (remaining < LOW_THRESHOLD) {
        // Fire-and-forget refill
        refillQueue(width, height, QUEUE_SIZE - remaining).catch(console.error);
      }

      return NextResponse.json(
        { board, width, height, generatedAt: new Date().toISOString() },
        {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-store",
          },
        }
      );
    }

    // Queue empty — generate one on the spot and kick off a refill
    const freshBoard = await generateBoardParallel(width, height, 4);
    refillQueue(width, height, QUEUE_SIZE).catch(console.error);

    return NextResponse.json(
      {
        board: freshBoard,
        width,
        height,
        generatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching board from queue:", error);
    return NextResponse.json(
      {
        error: "Failed to get board",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Refill a specific queue
async function refillQueue(width: number, height: number, count: number) {
  const key = kvKey(width, height);
  for (let i = 0; i < count; i++) {
    const board = await generateBoardParallel(width, height, 4);
    await kv.rpush(key, board);
  }
}

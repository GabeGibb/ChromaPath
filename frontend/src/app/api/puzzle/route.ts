import { BoardGenerator } from "@/shared";
import { MAX_BOARD_SIZE, MIN_BOARD_SIZE } from "@/shared/consts";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const size = parseInt(searchParams.get("size") || "5");

    if (size < MIN_BOARD_SIZE || size > MAX_BOARD_SIZE) {
      return NextResponse.json(
        { error: "Invalid board size" },
        { status: 400 }
      );
    }

    const boardGenerator = new BoardGenerator(null);
    const board = await boardGenerator.generateBoard(size);

    return NextResponse.json({
      board,
      size,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error generating board:", error);
    return NextResponse.json(
      {
        error: "Failed to generate board",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

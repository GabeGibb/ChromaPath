import { BoardGenerator } from "@/shared";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const boardGenerator = new BoardGenerator(null);
    const boards = [];

    // Generate boards with different square sizes
    const boardSizes = [
      { width: 5, height: 5 },
      { width: 6, height: 6 },
      { width: 7, height: 7 },
      { width: 8, height: 8 },
      { width: 9, height: 9 },
      { width: 10, height: 10 },
    ];

    for (const { width, height } of boardSizes) {
      const board = await boardGenerator.generateBoard(width, height);
      boards.push({
        board,
        width,
        height,
        generatedAt: new Date().toISOString(),
      });
    }
    return NextResponse.json({ boards });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to generate ladder boards",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

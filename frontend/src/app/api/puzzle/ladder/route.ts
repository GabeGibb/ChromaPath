import { BoardGenerator } from "@/shared";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const boardGenerator = new BoardGenerator(null);
    const boards = [];
    for (let size = 5; size <= 15; size++) {
      const board = await boardGenerator.generateBoard(size);
      boards.push({
        board,
        size,
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

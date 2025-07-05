import { BoardGenerator } from "@chromapath/shared";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const size = parseInt(searchParams.get("size") || "5");

    if (size < 5 || size > 15) {
      return NextResponse.json(
        { error: "Invalid board size" },
        { status: 400 }
      );
    }

    const boardGenerator = new BoardGenerator(null);
    const board = await boardGenerator.generateBoard(size);
    // const board = null;

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

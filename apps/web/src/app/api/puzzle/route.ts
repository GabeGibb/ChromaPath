import { BoardGenerator } from "@/shared";
import {
  MAX_BOARD_WIDTH,
  MAX_BOARD_HEIGHT,
  MIN_BOARD_WIDTH,
  MIN_BOARD_HEIGHT,
} from "@/shared/consts";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const width = parseInt(searchParams.get("width") || "5");
    const height = parseInt(searchParams.get("height") || "5");

    if (width < MIN_BOARD_WIDTH || width > MAX_BOARD_WIDTH) {
      return NextResponse.json(
        { error: "Invalid board width" },
        { status: 400 }
      );
    }

    if (height < MIN_BOARD_HEIGHT || height > MAX_BOARD_HEIGHT) {
      return NextResponse.json(
        { error: "Invalid board height" },
        { status: 400 }
      );
    }

    const boardGenerator = new BoardGenerator(null);
    const board = await boardGenerator.generateBoard(width, height);

    return NextResponse.json({
      board,
      width,
      height,
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

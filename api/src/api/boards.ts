import express, { Request, Response, Router } from "express";
import { boardService } from "../services/boardService";

const router: Router = express.Router();

// Route handler for generating random boards
router.get("/random", async (req: Request, res: Response) => {
  try {
    const size = parseInt(req.query.size as string) || 5;

    // Validate board size
    if (!boardService.isValidBoardSize(size)) {
      const constraints = boardService.getBoardSizeConstraints();
      res.status(400).json({
        error: "Invalid board size",
        minSize: constraints.minSize,
        maxSize: constraints.maxSize,
        requestedSize: size,
      });
      return;
    }

    const board = await boardService.generateBoard(size);

    res.json({
      board,
      size,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error generating board:", error);
    res.status(500).json({
      error: "Failed to generate board",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Health check endpoint
router.get("/health", (req: Request, res: Response) => {
  const constraints = boardService.getBoardSizeConstraints();
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    minBoardSize: constraints.minSize,
    maxBoardSize: constraints.maxSize,
  });
});

// Get board size constraints
router.get("/constraints", (req: Request, res: Response) => {
  const constraints = boardService.getBoardSizeConstraints();
  res.json(constraints);
});

export default router;

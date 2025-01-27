import { BoardGenerator } from "@chromapath/shared";
import express, { Request, Response } from "express";

const boardGenerator = new BoardGenerator();
const router = express.Router();

router.get("/random", async (req: Request, res: Response) => {
	const size = parseInt(req.query.size as string) || 5;
	const board = await boardGenerator.generateBoard(size);
	res.json(board);
});

export default router;

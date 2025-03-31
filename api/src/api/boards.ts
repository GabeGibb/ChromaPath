import { BoardGenerator } from "@chromapath/shared";
import express, { Request, Response } from "express";

const boardGenerator = new BoardGenerator(null);
const router = express.Router();

// Cache for boards with size > 10
const CACHE_SIZE = 1;
const MAX_BOARD_SIZE = 17; // Maximum board size to cache
const boardCache: Map<number, any[]> = new Map();

// Function to generate and cache a board of specific size
async function generateAndCacheBoard(size: number): Promise<void> {
	if (size <= 10) return; // Only cache boards larger than size 10

	if (!boardCache.has(size)) {
		boardCache.set(size, []);
	}

	const cacheForSize = boardCache.get(size)!;
	if (cacheForSize.length < CACHE_SIZE) {
		const newBoard = await boardGenerator.generateBoard(size);
		cacheForSize.push(newBoard);
	}
}

// Function to get a board from cache or generate a new one
async function getBoardOfSize(size: number): Promise<any> {
	if (size <= 10) {
		// For small boards, generate on demand
		return await boardGenerator.generateBoard(size);
	}

	// For larger boards, use cache
	if (!boardCache.has(size)) {
		boardCache.set(size, []);
	}

	const cacheForSize = boardCache.get(size)!;

	// If cache is empty, generate a new board
	if (cacheForSize.length === 0) {
		const newBoard = await boardGenerator.generateBoard(size);

		// Start background job to populate cache
		setTimeout(() => repopulateCache(size), 0);

		return newBoard;
	}

	// Return a board from cache
	const board = cacheForSize.shift();

	// If cache is getting low, start repopulating in background
	if (cacheForSize.length < CACHE_SIZE / 2) {
		setTimeout(() => repopulateCache(size), 0);
	}

	return board;
}

// Function to repopulate cache for a specific size
async function repopulateCache(size: number): Promise<void> {
	if (size <= 10) return;

	const cacheForSize = boardCache.get(size) || [];
	const neededBoards = CACHE_SIZE - cacheForSize.length;

	for (let i = 0; i < neededBoards; i++) {
		await generateAndCacheBoard(size);
	}
}

// Initialize cache on startup for common large board sizes
async function initializeCache(): Promise<void> {
	// Populate cache for sizes 11-15 as an example
	// You can adjust this based on your common board sizes
	for (let size = 11; size <= MAX_BOARD_SIZE; size++) {
		for (let i = 0; i < CACHE_SIZE; i++) {
			await generateAndCacheBoard(size);
		}
		console.log(`Initialized cache for board size ${size} with ${CACHE_SIZE} boards`);
	}
}

// Initialize cache on startup
initializeCache().catch((err) => {
	console.error("Failed to initialize board cache:", err);
});

// Route handler
router.get("/random", async (req: Request, res: Response) => {
	const size = parseInt(req.query.size as string) || 5;
	const board = await getBoardOfSize(size);
	res.json(board);
});

export default router;

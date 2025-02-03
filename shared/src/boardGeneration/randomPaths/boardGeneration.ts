import { ChromaPathRenderer } from "../../../../client/src/components/game/Renderer";
import { getValidNeighbors, shuffleArray } from "../../boardUtils";
import { Board, Point } from "../../types";

export class BoardGenerator {
	private boardSize: number = 5;
	private board: Board = [];
	private readonly maxAttempts = 1000;
	private curColorIndex = 0;
	private minDistanceBetweenEndpoints = 3;
	private maxNumPaths = 50;
	private renderer: ChromaPathRenderer | null = null;
	private pathStack: Point[][] = [];

	constructor(renderer: ChromaPathRenderer | null) {
		this.renderer = renderer;
	}

	async generateBoard(boardSize: number): Promise<Board> {
		this.boardSize = boardSize;
		this.maxNumPaths = this.boardSize * 1.2; // Arbitrary

		for (let attempt = 0; attempt < this.maxAttempts; attempt++) {
			this.board = this.initializeEmptyBoard();
			if (await this.generateValidBoard()) {
				// If board valid remove paths
				this.removeNonEndpoints();
				console.log("attempts", attempt);
				return this.board;
			}
		}
		throw new Error("Failed to generate valid board after maximum attempts");
	}

	private initializeEmptyBoard(): Board {
		return Array(this.boardSize)
			.fill(null)
			.map(() => Array(this.boardSize).fill(null));
	}

	// private drawBoard(): void {
	// 	if (!this.renderer) return;
	// 	const gameState: GameState = {
	// 		board: this.board,
	// 		paths: [],
	// 		currentPathIndex: null,
	// 		startPoint: null,
	// 		completed: false,
	// 		mouseX: 0,
	// 		mouseY: 0,
	// 	};
	// 	this.renderer.render(gameState, this.boardSize);
	// }

	private removeNonEndpoints() {
		/* Removes all non-endpoint cells from the board */
		for (let y = 0; y < this.boardSize; y++) {
			for (let x = 0; x < this.boardSize; x++) {
				const cell = this.board[y][x];
				if (!cell?.isEndpoint) {
					this.board[y][x] = null;
				}
			}
		}
	}

	private async generateValidBoard(): Promise<boolean> {
		this.curColorIndex = 0;

		while (true) {
			if ((await this.placeColorEndpoints()) && this.curColorIndex < this.maxNumPaths) {
				this.curColorIndex++;
				if (this.curColorIndex >= this.maxNumPaths) {
					return false;
				}
				if (this.validateBoard()) {
					return true;
				}
			} else {
				const lastPath = this.pathStack.pop();
				if (!lastPath) {
					return false;
				}
				// Remove last path
				for (const point of lastPath) {
					this.board[point.y][point.x] = null;
				}

				// return false;
			}
		}
	}

	private async placeColorEndpoints(): Promise<boolean> {
		const blockedPaths = this.findBlockedPaths();
		if (blockedPaths.length > 0) {
			for (const blockedPath of blockedPaths) {
				if (await this.attemptPathPlacement(blockedPath)) {
					return true;
				}
			}
		}

		// Arbitrarily loop through
		for (let j = 0; j < this.boardSize; j++) {
			const emptyCells = shuffleArray(this.findEmptyCells());
			for (let i = 0; i < emptyCells.length; i++) {
				if (await this.attemptPathPlacement(emptyCells[i])) {
					return true;
				}
			}
		}
		return false; // Return false if no valid placement was found
	}

	private async attemptPathPlacement(start: Point): Promise<boolean> {
		this.board[start.y][start.x] = { pathIndex: this.curColorIndex, isEndpoint: true };
		const path = this.findValidPath(this.board, start);

		if (!path) {
			this.board[start.y][start.x] = null;
			return false;
		}

		const end = path[path.length - 1];
		this.board[end.y][end.x] = { pathIndex: this.curColorIndex, isEndpoint: true };

		// Place the path
		for (const point of path.slice(1, -1)) {
			this.board[point.y][point.x] = { pathIndex: this.curColorIndex, isEndpoint: false };
		}

		// Check if board state is still valid after placing the path
		if (!this.hasPotentialForValidSolution()) {
			// If not valid remove the path
			this.board[start.y][start.x] = null;
			this.board[end.y][end.x] = null;

			for (const point of path.slice(1, -1)) {
				this.board[point.y][point.x] = null;
			}
			return false;
		}
		this.pathStack.push(path);

		return true;
	}

	private findBlockedPaths(): Point[] {
		const blockedPaths: Point[] = [];

		for (let y = 0; y < this.boardSize; y++) {
			for (let x = 0; x < this.boardSize; x++) {
				const cell = this.board[y][x];
				if (!cell) {
					const neighbors = getValidNeighbors(this.board, { x, y }, new Set(), false);
					if (neighbors.length === 1) {
						blockedPaths.push({ x, y });
					}
				}
			}
		}

		return blockedPaths;
	}

	private findEmptyCells(): Point[] {
		const emptyCells: Point[] = [];
		for (let y = 0; y < this.boardSize; y++) {
			for (let x = 0; x < this.boardSize; x++) {
				if (!this.board[y][x]) {
					emptyCells.push({ x, y });
				}
			}
		}

		return emptyCells;
	}

	// TODO: FIND WINDIER PATHS
	private findValidPath(board: Board, start: Point): Point[] | null {
		const visited = new Set<string>();
		const queue: { point: Point; path: Point[] }[] = [{ point: start, path: [start] }];
		const minPathLength = Math.max(this.minDistanceBetweenEndpoints, this.boardSize * 1.2 - this.curColorIndex);

		while (queue.length > 0) {
			const { point, path } = queue.shift()!;
			const key = `${point.x},${point.y}`;
			if (visited.has(key)) continue;
			visited.add(key);

			const neighbors = getValidNeighbors(this.board, point, visited, false);

			// Check if this could be a valid ending
			if (path.length >= minPathLength && !board[point.y][point.x]) {
				// If we have no neighbors, definitely end here
				if (neighbors.length === 0) return path;
			}

			// const shuffledNeighbors = neighbors;
			const shuffledNeighbors = shuffleArray(neighbors);
			for (const neighbor of shuffledNeighbors) {
				queue.push({
					point: neighbor,
					path: [...path, neighbor],
				});
			}
		}

		return null;
	}

	private hasPotentialForValidSolution(): boolean {
		const emptyCells: Point[] = [];
		for (let y = 0; y < this.boardSize; y++) {
			for (let x = 0; x < this.boardSize; x++) {
				if (!this.board[y][x]) {
					emptyCells.push({ x, y });
				}
			}
		}

		// Check if there are too many empty cells
		// const threshold = this.boardSize * this.boardSize - this.curColorIndex * this.boardSize;
		// if (emptyCells.length > threshold) {
		// 	return false;
		// }

		// Region detection and validation
		const regions: Point[][] = [];
		const visited = new Set<string>();

		for (const cell of emptyCells) {
			const key = `${cell.x},${cell.y}`;
			if (!visited.has(key)) {
				const region: Point[] = [];
				const queue: Point[] = [cell];

				while (queue.length > 0) {
					const current = queue.shift()!;
					const currentKey = `${current.x},${current.y}`;

					if (!visited.has(currentKey)) {
						visited.add(currentKey);
						region.push(current);

						const neighbors = getValidNeighbors(this.board, current, visited, false);
						for (const neighbor of neighbors) {
							if (!visited.has(`${neighbor.x},${neighbor.y}`)) {
								queue.push(neighbor);
							}
						}
					}
				}
				regions.push(region);
			}
		}

		// Check for problematic 2-cell regions
		for (const region of regions) {
			if (region.length < this.minDistanceBetweenEndpoints) {
				return false;
			}
		}

		return true;
	}

	private validateBoard(): boolean {
		for (let y = 0; y < this.boardSize; y++) {
			for (let x = 0; x < this.boardSize; x++) {
				const cell = this.board[y][x];
				// If any cell is null return false
				if (!cell) {
					return false;
				}
			}
		}

		if (this.curColorIndex + 1 < this.boardSize) {
			return false;
		}

		// Check that all placed colors have exactly two endpoints
		return true;
	}
}

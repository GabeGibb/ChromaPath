import { ChromaPathRenderer } from "../../../../client/src/components/game/Renderer";
import { getValidNeighbors, shuffleArray } from "../../boardUtils";
import { Board, GameState, Point } from "../../types";

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
				// this.removeNonEndpoints();
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

	private drawBoard(): void {
		if (!this.renderer) return;
		const gameState: GameState = {
			board: this.board,
			paths: [],
			currentPathIndex: null,
			startPoint: null,
			completed: false,
			mouseX: 0,
			mouseY: 0,
		};
		this.renderer.render(gameState, this.boardSize);
	}
	private async debugBoard(timeout = 100): Promise<void> {
		this.drawBoard();
		await new Promise((resolve) => setTimeout(resolve, timeout));
	}

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
			if (this.curColorIndex >= this.maxNumPaths - 1) {
				return false;
			}
			if ((await this.placeColorEndpoints()) && this.curColorIndex < this.maxNumPaths) {
				await this.debugBoard(100);
				this.curColorIndex++;

				if (this.validateBoard()) {
					await this.debugBoard(100);
					return true;
				}
			} else {
				return false;
				// TODO: RECURSE
				// const lastPath = this.pathStack.pop();
				// if (!lastPath) {
				// 	return false;
				// }

				// // Remove last path
				// for (const point of lastPath) {
				// 	this.board[point.y][point.x] = null;
				// }

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

		await this.debugBoard(100);

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
		const queue: { point: Point; path: Point[] }[] = [
			{
				point: start,
				path: [start],
			},
		];

		const minPathLength = Math.max(this.minDistanceBetweenEndpoints, this.boardSize * 1.2 - this.curColorIndex);

		// Weights favor continuing straight with occasional turns
		const curWeights = {
			straight: 100,
			left: 100,
			right: 100,
		};
		while (queue.length > 0) {
			const weights = {
				straight: Math.random() * curWeights.straight, // High weight to favor straight paths
				left: Math.random() * curWeights.left, // Lower weights for turns
				right: Math.random() * curWeights.right,
			};
			const { point, path } = queue.shift()!;
			const key = `${point.x},${point.y}`;
			if (visited.has(key)) continue;
			visited.add(key);

			const neighbors = getValidNeighbors(this.board, point, visited, false);

			// Check if this could be a valid ending
			if (path.length >= minPathLength && !board[point.y][point.x]) {
				if (neighbors.length === 0) return path;
			}

			// Get the previous point to determine current direction
			const prevPoint = path.length >= 2 ? path[path.length - 2] : null;

			// Sort neighbors by their directional weights
			const weightedNeighbors = neighbors.sort((a, b) => {
				const directionA = this.getDirection(prevPoint, point, a);
				const directionB = this.getDirection(prevPoint, point, b);

				const weightA = weights[directionA] || 0;
				const weightB = weights[directionB] || 0;

				return weightB - weightA;
			});

			// Get direction and make it less likely to prevent straight paths
			if (weightedNeighbors.length > 0) {
				const direction = this.getDirection(prevPoint, point, weightedNeighbors[0]);
				if (direction === "straight") curWeights[direction] = curWeights[direction] / 2;
				else curWeights.straight = 500;
				// curWeights[direction] - 20;
			}

			for (const neighbor of weightedNeighbors) {
				queue.push({
					point: neighbor,
					path: [...path, neighbor],
				});
			}
		}

		return null;
	}

	private getDirection(prev: Point | null, current: Point, next: Point): "straight" | "left" | "right" {
		if (!prev) return "straight";

		// Determine current movement vector
		const currentDx = current.x - prev.x;
		const currentDy = current.y - prev.y;

		// Determine next movement vector
		const nextDx = next.x - current.x;
		const nextDy = next.y - current.y;

		// If moving in same direction (either x or y), it's straight
		if (currentDx === nextDx && currentDy === nextDy) {
			return "straight";
		}

		// Determine turn direction based on current movement
		if (currentDx !== 0) {
			// Moving horizontally
			return nextDy > 0 ? "right" : "left";
		} else {
			// Moving vertically
			return nextDx > 0 ? "left" : "right";
		}
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
				console.log("HUH");
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

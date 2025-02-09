import { ChromaPathRenderer } from "../../../../client/src/components/game/Renderer";
import getCombinationsArray, { getValidNeighbors, shuffleArray } from "../../boardUtils";
import { Board, GameState, Point } from "../../types";

export class BoardGenerator {
	private boardSize: number = 5;
	private board: Board = [];
	private readonly maxAttempts = 100;
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

	private async debugBoard(timeout = 100): Promise<void> {
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
				// return true;
				this.curColorIndex++;

				if (await this.validateBoard()) {
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
		// for (let j = 0; j < this.boardSize; j++) {
		const emptyCells = shuffleArray(this.findEmptyCells());
		for (let i = 0; i < emptyCells.length; i++) {
			if (await this.attemptPathPlacement(emptyCells[i])) {
				return true;
			}
		}
		// }
		return false; // Return false if no valid placement was found
	}

	private async attemptPathPlacement(start: Point): Promise<boolean> {
		this.board[start.y][start.x] = { pathIndex: this.curColorIndex, isEndpoint: true };
		const path = this.findValidPath(start);

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
		if (!(await this.hasPotentialForValidSolution())) {
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

	private findValidPath(start: Point): Point[] | null {
		const wouldCreateInvalidAdjacency = (path: Point[], newPoint: Point): boolean => {
			// Check how many path cells would be adjacent to the new point
			let adjacentCount = 0;
			const directions = [
				{ x: -1, y: 0 },
				{ x: 1, y: 0 },
				{ x: 0, y: -1 },
				{ x: 0, y: 1 },
			];

			for (const dir of directions) {
				const checkX = newPoint.x + dir.x;
				const checkY = newPoint.y + dir.y;
				if (path.some((p) => p.x === checkX && p.y === checkY)) {
					adjacentCount++;
				}
			}

			// New point should not have more than 2 adjacent path cells
			if (adjacentCount > 1) return true;

			// Also check if adding this point would cause any existing
			// path cells to have more than 2 adjacent cells
			for (const pathPoint of path) {
				let pointAdjacencyCount = 0;
				for (const dir of directions) {
					const checkX = pathPoint.x + dir.x;
					const checkY = pathPoint.y + dir.y;
					if (checkX === newPoint.x && checkY === newPoint.y) {
						pointAdjacencyCount++;
					} else if (path.some((p) => p.x === checkX && p.y === checkY)) {
						pointAdjacencyCount++;
					}
				}
				if (pointAdjacencyCount > 2) return true;
			}

			return false;
		};
		const visited = new Set<string>();
		const queue: { point: Point; path: Point[] }[] = [
			{
				point: start,
				path: [start],
			},
		];

		// Weights favor continuing straight with occasional turns
		const curWeights = {
			straight: 200,
			left: 100,
			right: 100,
		};
		const maxPath = this.boardSize * 1.5;
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

			const neighbors = getValidNeighbors(this.board, point, visited, false).filter(
				(neighbor) => !wouldCreateInvalidAdjacency(path, neighbor)
			);

			// Check if this could be a valid ending
			if (path.length >= this.minDistanceBetweenEndpoints && (path.length == maxPath || neighbors.length === 0)) {
				// if (neighbors.length === 0 && path.length >= this.minDistanceBetweenEndpoints) {
				return path;
				// }
				// continue;
			}
			if (neighbors.length === 0) {
				return null;
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
				// if (direction === "straight") curWeights[direction] = curWeights[direction] / 2;
				if (direction === "left") {
					// curWeights.right /= 2;
					// curWeights.left /= 2;
				}
				if (direction === "right") {
					// curWeights.right /= 2;
					// curWeights.left /= 2;
				}
				// curWeights[direction] - 20;
			}
			const neighbor = weightedNeighbors[0];
			queue.push({
				point: neighbor,
				path: [...path, neighbor],
			});
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

	private async hasPotentialForValidSolution(): Promise<boolean> {
		// TODO: This could be more sophisticated
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

	private checkBoardHasEmptyCells(): boolean {
		for (let y = 0; y < this.boardSize; y++) {
			for (let x = 0; x < this.boardSize; x++) {
				if (!this.board[y][x]) {
					return true;
				}
			}
		}
		return false;
	}

	private async validateBoard(): Promise<boolean> {
		if (this.checkBoardHasEmptyCells()) {
			return false;
		}
		const betterSolution = await this.pathsHaveBetterSolution();
		if (betterSolution) {
			return false;
		}

		// Check that all placed colors have exactly two endpoints
		return true;
	}

	private async pathsHaveBetterSolution(): Promise<boolean> {
		const boardCopy = this.board.map((row) => row.map((cell) => cell));

		// Generate combinations of paths to remove
		const numPathsToRemove = 2; // Number of complete lines to remove and test
		const pathCombinations = getCombinationsArray(this.curColorIndex, numPathsToRemove);

		// Test each combination of paths
		for (const pathsToRemove of pathCombinations) {
			// Create temporary board without the selected paths
			await this.debugBoard(500);
			this.board = this.createBoardWithoutPaths(boardCopy, pathsToRemove);
			await this.debugBoard(500);
			// Try to find alternate solutions for removed paths
			if (this.canSolveWithAlternatePaths(this.board, pathsToRemove)) {
				return true; // Found an alternate solution, so current solution isn't optimal
			}
		}
		this.board = boardCopy;
		return false;
	}

	private createBoardWithoutPaths(originalBoard: Board, pathsToRemove: number[]): Board {
		const tempBoard: Board = originalBoard.map((row) =>
			row.map((cell) => (cell && !cell.isEndpoint && pathsToRemove.includes(cell.pathIndex) ? null : cell))
		);
		return tempBoard;
	}

	private canSolveWithAlternatePaths(board: Board, removedPaths: number[]): boolean {
		// For each removed path, find its endpoints
		for (const pathIndex of removedPaths) {
			const endpoints = this.findEndpointsForPath(pathIndex);
			if (!endpoints) continue;

			const [start, end] = endpoints;

			// Try to find a new valid path between the endpoints
			if (!this.findAlternatePath(board, start, end)) {
				return false; // If we can't find a valid path for any pair, this combination isn't solvable
			}
		}

		return true; // Found valid alternate paths for all removed paths
	}

	private findEndpointsForPath(pathIndex: number): [Point, Point] | null {
		const endpoints: Point[] = [];

		for (let y = 0; y < this.boardSize; y++) {
			for (let x = 0; x < this.boardSize; x++) {
				const cell = this.board[y][x];
				if (cell?.pathIndex === pathIndex && cell.isEndpoint) {
					endpoints.push({ x, y });
				}
			}
		}

		return endpoints.length === 2 ? [endpoints[0], endpoints[1]] : null;
	}

	private findAlternatePath(board: Board, start: Point, end: Point): boolean {
		const visited = new Set<string>();
		const queue: { point: Point; path: Point[] }[] = [{ point: start, path: [start] }];

		while (queue.length > 0) {
			const { point, path } = queue.shift()!;
			const key = `${point.x},${point.y}`;

			if (visited.has(key)) continue;
			visited.add(key);

			// If we reached the end point with a valid path
			if (point.x === end.x && point.y === end.y && path.length >= this.minDistanceBetweenEndpoints) {
				// Verify the path is valid (no more than 2 adjacent cells per point)
				if (this.isValidPath(path)) {
					return true;
				}
				continue;
			}

			const neighbors = getValidNeighbors(board, point, visited, false);
			for (const neighbor of neighbors) {
				queue.push({
					point: neighbor,
					path: [...path, neighbor],
				});
			}
		}

		return false;
	}

	private isValidPath(path: Point[]): boolean {
		// Check each point in the path
		for (let i = 0; i < path.length; i++) {
			const point = path[i];
			const isEndpoint = i === 0 || i === path.length - 1;

			if (!isEndpoint) {
				// Count adjacent path cells
				let adjacentCount = 0;
				const directions = [
					{ x: -1, y: 0 },
					{ x: 1, y: 0 },
					{ x: 0, y: -1 },
					{ x: 0, y: 1 },
				];

				for (const dir of directions) {
					const checkX = point.x + dir.x;
					const checkY = point.y + dir.y;

					if (path.some((p) => p.x === checkX && p.y === checkY)) {
						adjacentCount++;
					}
				}

				// Non-endpoint cells should have exactly 2 adjacent cells
				if (adjacentCount !== 2) {
					return false;
				}
			}
		}

		return true;
	}
}

import { ChromaPathRenderer } from "../../client/src/components/game/Renderer";
import { getValidNeighbors, shuffleArray } from "./boardUtils";
import { Board, GameState, Point } from "./types";

export class BoardGenerator {
	private boardSize: number = 5;
	private board: Board = [];
	private readonly maxAttempts = 10000;
	private curColorIndex = 0;
	private minDistanceBetweenEndpoints = 3;
	private maxNumColors = 50;
	private colorsArray: string[] = [];
	private renderer: ChromaPathRenderer | null = null;

	constructor(renderer: ChromaPathRenderer | null) {
		this.renderer = renderer;
	}

	async generateBoard(boardSize: number): Promise<Board> {
		this.boardSize = boardSize;
		this.maxNumColors = this.boardSize * 1.25; // Arbitrary

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

	private drawBoard(): void {
		if (!this.renderer) return;
		const gameState: GameState = {
			board: this.board,
			paths: {},
			currentColor: null,
			startPoint: null,
			completed: false,
			mouseX: 0,
			mouseY: 0,
		};
		this.renderer.render(gameState, this.boardSize);
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
		this.colorsArray = this.getDistancedColorArray();

		while (true) {
			if (await this.placeColorEndpoints()) {
				this.curColorIndex++;
				// if (this.curColorIndex >= this.maxNumColors) {
				// 	return false;
				// }
				if (this.validateBoard()) {
					return true;
				}
				this.drawBoard();

				// await new Promise((resolve) => setTimeout(resolve, 500));
			} else {
				this.drawBoard();

				// await new Promise((resolve) => setTimeout(resolve, 500));

				return false;
			}
		}
	}

	private async placeColorEndpoints(): Promise<boolean> {
		const blockedPaths = this.findBlockedPaths();
		if (blockedPaths.length > 0) {
			for (const blockedPath of blockedPaths) {
				for (let i = 0; i < this.boardSize; i++) {
					if (await this.attemptPathPlacement(blockedPath)) {
						// console.log("unblocked path");
						return true;
					}
				}
			}
		}

		// console.log("HERE!!");

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
		// Get next random empty cell
		const color = this.colorsArray[this.curColorIndex];

		this.board[start.y][start.x] = { color, isEndpoint: true };
		const path = this.findValidPath(this.board, start);

		if (!path) {
			this.board[start.y][start.x] = null;
			return false;
		}

		const end = path[path.length - 1];
		this.board[end.y][end.x] = { color, isEndpoint: true };

		// Place the path
		for (const point of path.slice(1, -1)) {
			this.board[point.y][point.x] = { color, isEndpoint: false };
		}
		this.drawBoard();
		// await new Promise((resolve) => setTimeout(resolve, 500));

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
			// console.log(regions);
			if (region.length < this.minDistanceBetweenEndpoints) {
				// console.log(region.length, this.minDistanceBetweenEndpoints);
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

	private getDistancedColorArray(): string[] {
		function maximizePairwiseDistance(numColors: number): string[] {
			const colors: number[][] = [];

			// Generate permutations of high and low RGB values
			const levels = [0, 255, 85, 170]; // High, low, and medium values
			for (const r of levels) {
				for (const g of levels) {
					for (const b of levels) {
						if (r === 0 && g === 0 && b === 0) continue; // Skip black
						if (r === 255 && g === 255 && b === 255) continue; // Skip white
						colors.push([r, g, b]);
					}
				}
			}

			// Select `numColors` points, maximizing pairwise distance
			const selectedColors: number[][] = [];
			selectedColors.push(colors[0]); // Start with the first color

			while (selectedColors.length < numColors && colors.length > 0) {
				let maxDistance = 0;
				let nextColor: number[] | null = null;

				for (const color of colors) {
					const minDistanceToSet = Math.min(...selectedColors.map((c) => distance3D(c, color)));

					if (minDistanceToSet > maxDistance) {
						maxDistance = minDistanceToSet;
						nextColor = color;
					}
				}

				if (nextColor) {
					selectedColors.push(nextColor);
					colors.splice(colors.indexOf(nextColor), 1); // Remove selected color
				}
			}

			return selectedColors.map(([r, g, b]) => `rgb(${r}, ${g}, ${b})`);
		}

		function distance3D(a: number[], b: number[]): number {
			return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2) + Math.pow(a[2] - b[2], 2));
		}

		// Generate and assign colors
		const colors = maximizePairwiseDistance(62); // TODO: 62 is hardcoded because 4 x 4 x 4 = 64, but we skip black and white

		return colors;
	}
}

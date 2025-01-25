import { ChromaPathRenderer } from "./Renderer";
import { Board, GameState, Point } from "./Types";

export class BoardGenerator {
	private boardSize: number = 5;
	private readonly maxAttempts = 1000;
	private curColorIndex = 0;
	private minDistanceBetweenEndpoints = 3;
	private renderer: ChromaPathRenderer | null = null;

	constructor(renderer: ChromaPathRenderer | null = null) {
		this.renderer = renderer;
	}

	async generateBoard(boardSize: number): Promise<Board> {
		this.boardSize = boardSize;

		for (let attempt = 0; attempt < this.maxAttempts; attempt++) {
			const board = this.initializeEmptyBoard();
			if (await this.generateValidBoard(board)) {
				// If board valid remove paths
				this.removeNonEndpoints(board);
				return board;
			}
		}
		throw new Error("Failed to generate valid board after maximum attempts");
	}

	private initializeEmptyBoard(): Board {
		return Array(this.boardSize)
			.fill(null)
			.map(() => Array(this.boardSize).fill(null));
	}

	private removeNonEndpoints(board: Board) {
		for (let y = 0; y < this.boardSize; y++) {
			for (let x = 0; x < this.boardSize; x++) {
				const cell = board[y][x];
				if (!cell?.isEndpoint) {
					board[y][x] = null;
				}
			}
		}
	}

	private async generateValidBoard(board: Board): Promise<boolean> {
		// Try to place each color's endpoints
		this.curColorIndex = 0;
		const colorsMap = this.convertIndicesToColors(25, board);
		while (true) {
			const color = colorsMap[this.curColorIndex.toString()];
			if (this.placeColorEndpoints(board, color)) {
				this.curColorIndex++;
				const GameState: GameState = {
					board: board,
					paths: {},
					currentColor: null,
					startPoint: null,
					completed: false,
					mouseX: 0,
					mouseY: 0,
				};
				this.renderer?.render(GameState, this.boardSize);
				await new Promise((resolve) => setTimeout(resolve, 50));
			} else {
				return false;
			}
			if (this.validateBoard(board)) {
				this.convertIndicesToColors(this.curColorIndex, board);
				return true;
			}
		}
	}

	private placeColorEndpoints(board: Board, color: string): boolean {
		const emptyCells = this.findEmptyCells(board);
		for (let i = 0; i < emptyCells.length; i++) {
			// Get next random empty cell
			const randIndex = Math.floor(Math.random() * emptyCells.length);
			const start = emptyCells[randIndex];
			emptyCells.splice(randIndex, 1);

			if (!start) return false;

			// Arbitrarily repeat path finding
			// TODO: investigate
			for (let j = 0; j < this.boardSize; j++) {
				board[start.y][start.x] = { color, isEndpoint: true };
				// Try to find a valid path to place the second endpoint
				const path = this.findValidPath(board, start);
				if (!path) {
					board[start.y][start.x] = null;
					// return false;
					continue;
				}

				const end = path[path.length - 1];
				board[end.y][end.x] = { color, isEndpoint: true };

				// Place the path (optional - can be left empty for puzzle generation)
				for (const point of path.slice(1, -1)) {
					board[point.y][point.x] = { color, isEndpoint: false };
				}
				// Check if board state is still valid after placing the path
				if (!this.validateBoardStateOk(board, path)) {
					board[start.y][start.x] = null;
					// return false;
					board[end.y][end.x] = null;

					for (const point of path.slice(1, -1)) {
						board[point.y][point.x] = null;
					}
					continue;
				}
				return true;
			}
		}

		return false;
	}

	private findEmptyCells(board: Board): Point[] {
		const emptyCells: Point[] = [];
		for (let y = 0; y < this.boardSize; y++) {
			for (let x = 0; x < this.boardSize; x++) {
				if (!board[y][x]) {
					emptyCells.push({ x, y });
				}
			}
		}

		return emptyCells;
	}

	private findValidPath(board: Board, start: Point): Point[] | null {
		const visited = new Set<string>();
		const queue: { point: Point; path: Point[] }[] = [{ point: start, path: [start] }];
		const minPathLength = Math.max(this.minDistanceBetweenEndpoints, this.boardSize * 1.2 - this.curColorIndex); // Arbitrary magic number that decreases with more colors
		const maxPathLength = Math.floor(this.boardSize * this.boardSize); // No limit really

		while (queue.length > 0) {
			const { point, path } = queue.shift()!;
			const key = `${point.x},${point.y}`;

			if (visited.has(key)) continue;
			visited.add(key);

			const neighbors = this.getValidNeighbors(board, point, visited, false);

			if (path.length >= minPathLength && !board[point.y][point.x] && neighbors.length === 0) {
				return path;
			}

			// ! THIS LINE ADDS RANDOMNESS TO THE PATH BUT IS EXPENSIVE
			// const shuffledNeighbors = neighbors.sort(() => Math.random() - 0.5);

			if (path.length < maxPathLength) {
				for (const neighbor of neighbors) {
					queue.push({
						point: neighbor,
						path: [...path, neighbor],
					});
				}
			}
		}

		return null;
	}

	private validateBoardStateOk(board: Board, currentPath: Point[]): boolean {
		const emptyCells: Point[] = [];
		for (let y = 0; y < this.boardSize; y++) {
			for (let x = 0; x < this.boardSize; x++) {
				if (!board[y][x] && !currentPath.some((p) => p.x === x && p.y === y)) {
					emptyCells.push({ x, y });
				}
			}
		}

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

						const neighbors = this.getValidNeighbors(board, current, visited);
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

		return !regions.some((region) => region.length <= this.minDistanceBetweenEndpoints);
	}

	public getValidNeighbors(board: Board, point: Point, visited: Set<string>, includeEndpoint: boolean = false): Point[] {
		const directions = [
			{ dx: 0, dy: -1 },
			{ dx: 1, dy: 0 },
			{ dx: 0, dy: 1 },
			{ dx: -1, dy: 0 },
		];

		return directions
			.map(({ dx, dy }) => ({
				x: point.x + dx,
				y: point.y + dy,
			}))
			.filter(
				({ x, y }) =>
					x >= 0 &&
					x < this.boardSize &&
					y >= 0 &&
					y < this.boardSize &&
					(!board[y][x] || (includeEndpoint && board[y][x]?.isEndpoint)) &&
					!visited.has(`${x},${y}`)
			);
	}

	private validateBoard(board: Board): boolean {
		const colorCount = new Map<string, number>();

		for (let y = 0; y < this.boardSize; y++) {
			for (let x = 0; x < this.boardSize; x++) {
				const cell = board[y][x];
				// If any cell is null return false
				if (!cell) {
					return false;
				}
				if (cell?.isEndpoint) {
					colorCount.set(cell.color, (colorCount.get(cell.color) || 0) + 1);
				}
			}
		}

		// if (colorCount.size < this.boardSize / 2) {
		// 	return false;
		// }

		// Check that all placed colors have exactly two endpoints
		return [...colorCount.values()].every((count) => count === 2);
	}

	private convertIndicesToColors(numColors: number, board: Board) {
		const indexToColorMap: { [key: string]: string } = {};

		function maximizePairwiseDistance(numColors: number): string[] {
			const colors: number[][] = [];

			// Generate permutations of high and low RGB values
			const levels = [0, 255, 128]; // High, low, and medium values
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
		const colors = maximizePairwiseDistance(numColors);

		for (let i = 0; i < colors.length; i++) {
			indexToColorMap[i.toString()] = colors[i];
		}
		return indexToColorMap;

		// for (let y = 0; y < this.boardSize; y++) {
		// 	for (let x = 0; x < this.boardSize; x++) {
		// 		const cell = board[y][x];
		// 		if (cell) {
		// 			cell.color = indexToColorMap[cell.color];
		// 		}
		// 	}
		// }
	}
}

import { Board, Point } from "./Types";

export class BoardGenerator {
	private boardSize: number = 5;
	private colors: string[] = [];
	private readonly maxAttempts = 10000;

	constructor() {}

	// TODO: THIS SHIT DONT WORK
	generateBoard(boardSize: number): Board {
		this.boardSize = boardSize;
		this.colors = Array.from({ length: this.boardSize }, (_, i) => {
			const hue = (i * 360) / this.boardSize; // evenly spaced hues
			return `hsl(${hue}, 100%, 50%)`; // full saturation and medium lightness
		});
		for (let attempt = 0; attempt < this.maxAttempts; attempt++) {
			const board = this.initializeEmptyBoard();
			if (this.generateValidBoard(board)) {
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
					// If the cell is not an endpoint remove it
					board[y][x] = null;
				}
			}
		}
	}

	private generateValidBoard(board: Board): boolean {
		// Shuffle colors to randomize placement order
		const shuffledColors = [...this.colors].sort(() => Math.random() - 0.5);
		for (const color of shuffledColors) {
			if (!this.placeColorEndpoints(board, color)) {
				return false;
			}
		}

		return this.validateBoard(board);
	}

	private placeColorEndpoints(board: Board, color: string): boolean {
		const start = this.findRandomEmptyCell(board);
		if (!start) return false;

		board[start.y][start.x] = { color, isEndpoint: true };

		// Try to find a valid path to place the second endpoint
		const path = this.findValidPath(board, start);
		if (!path) {
			board[start.y][start.x] = null;
			return false;
		}

		// If board state not ok after placing second endpoint, remove it and return false
		if (!this.validateBoardStateOk(board, path)) {
			board[start.y][start.x] = null;
			return false;
		}

		const end = path[path.length - 1];
		board[end.y][end.x] = { color, isEndpoint: true };

		// Place the path (optional - can be left empty for puzzle generation)
		for (const point of path.slice(1, -1)) {
			board[point.y][point.x] = { color, isEndpoint: false };
		}

		return true;
	}

	private findRandomEmptyCell(board: Board): Point | null {
		const emptyCells: Point[] = [];
		for (let y = 0; y < this.boardSize; y++) {
			for (let x = 0; x < this.boardSize; x++) {
				if (!board[y][x]) {
					emptyCells.push({ x, y });
				}
			}
		}
		if (emptyCells.length === 0) return null;
		return emptyCells[Math.floor(Math.random() * emptyCells.length)];
	}

	private findValidPath(board: Board, start: Point): Point[] | null {
		const visited = new Set<string>();
		const queue: { point: Point; path: Point[] }[] = [{ point: start, path: [start] }];
		const minPathLength = 3;
		const maxPathLength = Math.floor(this.boardSize * this.boardSize); // Allows for longer, winding paths

		while (queue.length > 0) {
			const { point, path } = queue.shift()!;
			const key = `${point.x},${point.y}`;

			if (visited.has(key)) continue;
			visited.add(key);

			// Get valid neighbors before checking for endpoint
			const neighbors = this.getValidNeighbors(board, point, visited);

			// Chance to end the path increases with length
			const pathLengthFactor = (path.length - minPathLength) / (maxPathLength - minPathLength);
			const endChance = Math.max(0, pathLengthFactor * 0.8); // max chance to end

			if (
				path.length >= minPathLength &&
				!board[point.y][point.x] &&
				(neighbors.length === 0 || Math.random() < endChance)
			) {
				return path;
			}

			// Randomize neighbor order for more varied paths
			const shuffledNeighbors = neighbors.sort(() => Math.random() - 0.5);

			// Only continue if path isn't too long
			if (path.length < maxPathLength) {
				for (const neighbor of shuffledNeighbors) {
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
		// Get all empty cells
		const emptyCells: Point[] = [];
		for (let y = 0; y < this.boardSize; y++) {
			for (let x = 0; x < this.boardSize; x++) {
				if (!board[y][x] && !currentPath.some((p) => p.x === x && p.y === y)) {
					emptyCells.push({ x, y });
				}
			}
		}

		// Group empty cells into connected regions
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

						// Add unvisited neighbors
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

		// Check if any region is too small (3 or fewer cells)
		return !regions.some((region) => region.length <= 3);
	}
	public getValidNeighbors(board: Board, point: Point, visited: Set<string>, includeEndpoint: boolean = false): Point[] {
		const directions = [
			{ dx: 0, dy: -1 }, // up
			{ dx: 1, dy: 0 }, // right
			{ dx: 0, dy: 1 }, // down
			{ dx: -1, dy: 0 }, // left
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
					(!board[y][x] || (includeEndpoint && board[y][x]?.isEndpoint)) && // Check if cell is empty or include endpoints if specified
					!visited.has(`${x},${y}`)
			);
	}

	private validateBoard(board: Board): boolean {
		// Check if all colors are placed with valid endpoints
		const colorCount = new Map<string, number>();

		for (let y = 0; y < this.boardSize; y++) {
			for (let x = 0; x < this.boardSize; x++) {
				const cell = board[y][x];
				if (!cell) {
					return false;
				}
				if (cell?.isEndpoint) {
					colorCount.set(cell.color, (colorCount.get(cell.color) || 0) + 1);
				}
			}
		}
		// Allow partially filled board during generation
		return [...colorCount.values()].every((count) => count === 2);
		// // Verify each color has exactly two endpoints
		// return [...colorCount.values()].every((count) => count === 2);
	}
}

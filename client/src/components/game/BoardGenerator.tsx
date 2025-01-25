import { Board, Point } from "./Types";

export class BoardGenerator {
	private boardSize: number = 5;
	private readonly maxAttempts = 10000;

	constructor() {}

	generateBoard(boardSize: number): Board {
		this.boardSize = boardSize;

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
					board[y][x] = null;
				}
			}
		}
	}

	private generateValidBoard(board: Board): boolean {
		// Shuffle colors to randomize placement order
		// Try to place each color's endpoints
		let i = 0;
		while (true) {
			const color = i.toString();
			if (this.placeColorEndpoints(board, color)) {
				i++;
			} else {
				return false;
			}
			if (this.validateBoard(board)) {
				this.convertIndicesToColors(i, board);
				return true;
			}
		}
	}

	private convertIndicesToColors(numColors: number, board: Board) {
		const indexToColorMap: { [key: string]: string } = {};
		for (let i = 0; i < numColors; i++) {
			const hue = (i * 360) / numColors;
			indexToColorMap[i.toString()] = `hsl(${hue}, 100%, 50%)`;
		}

		for (let y = 0; y < this.boardSize; y++) {
			for (let x = 0; x < this.boardSize; x++) {
				const cell = board[y][x];
				if (cell) {
					cell.color = indexToColorMap[cell.color];
				}
			}
		}
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

		// Check if board state is still valid after placing the path
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
		const minPathLength = this.boardSize;
		const maxPathLength = Math.floor(this.boardSize * this.boardSize);

		while (queue.length > 0) {
			const { point, path } = queue.shift()!;
			const key = `${point.x},${point.y}`;

			if (visited.has(key)) continue;
			visited.add(key);

			const neighbors = this.getValidNeighbors(board, point, visited, false);
			const pathLengthFactor = (path.length - minPathLength) / (maxPathLength - minPathLength);
			const endChance = Math.max(0, pathLengthFactor * 0);

			if (
				path.length >= minPathLength &&
				!board[point.y][point.x] &&
				(neighbors.length === 0 || Math.random() < endChance)
			) {
				return path;
			}

			const shuffledNeighbors = neighbors.sort(() => Math.random() - 0.5);

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

		return !regions.some((region) => region.length <= 3);
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

		// Check that all placed colors have exactly two endpoints
		return [...colorCount.values()].every((count) => count === 2);
	}
}

import { ChromaPathRenderer } from "./Renderer";
import { Board, GameState, Point } from "./Types";

export function getValidNeighbors(board: Board, point: Point, visited: Set<string>, includeEndpoint: boolean = false): Point[] {
	const directions = [
		{ dx: 0, dy: -1 },
		{ dx: 1, dy: 0 },
		{ dx: 0, dy: 1 },
		{ dx: -1, dy: 0 },
	];
	const boardSize = board.length;
	return directions
		.map(({ dx, dy }) => ({
			x: point.x + dx,
			y: point.y + dy,
		}))
		.filter(
			({ x, y }) =>
				x >= 0 &&
				x < boardSize &&
				y >= 0 &&
				y < boardSize &&
				(!board[y][x] || (includeEndpoint && board[y][x]?.isEndpoint)) &&
				!visited.has(`${x},${y}`)
		);
}

export class BoardGenerator {
	private boardSize: number = 5;
	private board: Board = [];
	private readonly maxAttempts = Infinity;
	private curColorIndex = 0;
	private minDistanceBetweenEndpoints = 3;
	private renderer: ChromaPathRenderer | null = null;
	private maxNumColors = 50;
	private colorsArray: string[] = [];

	constructor(renderer: ChromaPathRenderer | null = null) {
		this.renderer = renderer;
	}

	async generateBoard(boardSize: number): Promise<Board> {
		this.boardSize = boardSize;
		this.maxNumColors = this.boardSize * 1.25; // Arbitrary

		for (let attempt = 0; attempt < this.maxAttempts; attempt++) {
			console.log("Attempt");
			this.board = this.initializeEmptyBoard();
			if (await this.generateValidBoard()) {
				// If board valid remove paths
				this.removeNonEndpoints();
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
			if (this.placeColorEndpoints()) {
				// * animation logic
				if (this.boardSize < 10) {
					const gameState: GameState = {
						board: this.board,
						paths: {},
						currentColor: null,
						startPoint: null,
						completed: false,
						mouseX: 0,
						mouseY: 0,
					};

					await new Promise<void>((resolve) =>
						requestAnimationFrame(() => {
							this.renderer?.render(gameState, this.boardSize);
							resolve();
						})
					);
				}

				if (this.validateBoard()) {
					return true;
				}
			} else {
				return false;
			}
		}
	}

	private placeColorEndpoints(): boolean {
		const color = this.colorsArray[this.curColorIndex];
		const emptyCells = this.findEmptyCells();
		for (let i = 0; i < emptyCells.length; i++) {
			// Get next random empty cell
			const randIndex = Math.floor(Math.random() * emptyCells.length);
			const start = emptyCells[randIndex];
			emptyCells.splice(randIndex, 1);

			if (!start) return false;

			this.board[start.y][start.x] = { color, isEndpoint: true };
			const path = this.findValidPath(this.board, start);

			if (!path) {
				this.board[start.y][start.x] = null;
				continue;
			}

			const end = path[path.length - 1];
			this.board[end.y][end.x] = { color, isEndpoint: true };

			// Place the path
			for (const point of path.slice(1, -1)) {
				this.board[point.y][point.x] = { color, isEndpoint: false };
			}

			// Check if board state is still valid after placing the path
			if (!this.validateBoardStateOk(this.board, path)) {
				// If not valid remove the path
				this.board[start.y][start.x] = null;
				this.board[end.y][end.x] = null;

				for (const point of path.slice(1, -1)) {
					this.board[point.y][point.x] = null;
				}
				continue;
			}
			this.curColorIndex++;
			// if (!this.placeColorEndpoints()) {
			// 	this.curColorIndex--;
			// 	return false;
			// }
			return true;
		}

		return false; // Return false if no valid placement was found
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

	private shuffleArray(array: any[]) {
		const shuffled = [...array];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		return shuffled;
	}

	private findValidPath(board: Board, start: Point): Point[] | null {
		const visited = new Set<string>();
		const queue: { point: Point; path: Point[] }[] = [{ point: start, path: [start] }];
		const minPathLength = Math.max(this.minDistanceBetweenEndpoints, this.boardSize * 1.2 - this.curColorIndex); // Arbitrary magic number that decreases with more colors

		while (queue.length > 0) {
			const { point, path } = queue.shift()!;
			const key = `${point.x},${point.y}`;

			if (visited.has(key)) continue;
			visited.add(key);

			const neighbors = this.getValidNeighbors(point, visited, false);

			if (path.length >= minPathLength && !board[point.y][point.x] && neighbors.length === 0) {
				return path;
			}

			// ! THIS LINE ADDS RANDOMNESS TO THE PATH BUT IS EXPENSIVE
			const shuffledNeighbors = this.shuffleArray(neighbors);

			for (const neighbor of shuffledNeighbors) {
				queue.push({
					point: neighbor,
					path: [...path, neighbor],
				});
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
		// TODO: Maybe check for some suspect regions?

		// Original region size validation
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

						const neighbors = this.getValidNeighbors(current, visited);
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

	public getValidNeighbors(point: Point, visited: Set<string>, includeEndpoint: boolean = false): Point[] {
		return getValidNeighbors(this.board, point, visited, includeEndpoint);
	}

	private validateBoard(): boolean {
		const colorCount = new Map<string, number>();

		for (let y = 0; y < this.boardSize; y++) {
			for (let x = 0; x < this.boardSize; x++) {
				const cell = this.board[y][x];
				// If any cell is null return false
				if (!cell) {
					return false;
				}
				if (cell?.isEndpoint) {
					colorCount.set(cell.color, (colorCount.get(cell.color) || 0) + 1);
				}
			}
		}

		if (colorCount.size > this.maxNumColors) {
			return false;
		}

		// Check that all placed colors have exactly two endpoints
		return [...colorCount.values()].every((count) => count === 2);
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

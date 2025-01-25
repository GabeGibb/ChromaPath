import { BoardGenerator } from "./BoardGenerator";
import { Board, GameState, Point } from "./Types";

export class ChromaPathGame {
	private state: GameState;
	private boardSize: number;
	private boardGenerator: BoardGenerator;

	constructor(size: number = 5) {
		this.boardSize = size;
		this.boardGenerator = new BoardGenerator();
		this.state = this.initializeState();
	}

	private initializeState(): GameState {
		return {
			board: this.generateBoard(),
			paths: {},
			currentColor: null,
			startPoint: null,
			completed: false,
			mouseX: 0,
			mouseY: 0,
		};
	}

	private generateBoard(): Board {
		return this.boardGenerator.generateBoard(this.boardSize);
	}

	private isValidMove(x: number, y: number, color: string): boolean {
		const cell = this.state.board[y][x];

		// Check if position is already part of another path
		for (const [pathColor, path] of Object.entries(this.state.paths)) {
			if (pathColor !== color && path.some((p) => p.x === x && p.y === y)) {
				return false;
			}
		}

		// Check if the cell is part of the same color or is empty
		if (cell && cell.color !== color) {
			return false;
		}

		return true;
	}

	public handleCellClick(x: number, y: number): void {
		const cell = this.state.board[y][x];
		// Handle endpoint clicks
		if (cell?.isEndpoint) {
			this.state.currentColor = cell.color;
			this.state.startPoint = { x, y };
			this.state.paths[cell.color] = [{ x, y }];
		}

		// Check if clicked on any existing path
		for (const [color, path] of Object.entries(this.state.paths)) {
			const pathIndex = path.findIndex((p) => p.x === x && p.y === y);
			if (pathIndex !== -1) {
				this.state.currentColor = color;
				this.state.startPoint = path[0];
				this.state.paths[color] = path.slice(0, pathIndex + 1);
				return;
			}
		}
	}

	public handleDrag(x: number, y: number): void {
		if (!this.state.currentColor || !this.state.startPoint) return;

		const currentPath = this.state.paths[this.state.currentColor];
		const lastPoint = currentPath[currentPath.length - 1];

		if (!this.isValidMove(x, y, this.state.currentColor)) return;

		// Handle backtracking
		const backtrackIndex = currentPath.findIndex((p) => p.x === x && p.y === y);
		if (backtrackIndex !== -1) {
			this.state.paths[this.state.currentColor] = currentPath.slice(0, backtrackIndex + 1);
			return;
		}

		// Check if at non-start endpoint
		const isAtEndpoint = this.isAtEndpoint(lastPoint, this.state.startPoint);
		const adjacentBeyond = isAtEndpoint && currentPath.length > 1;

		if (isAtEndpoint && currentPath.length > 1) return;

		// Handle adjacent moves
		if (Math.abs(x - lastPoint.x) + Math.abs(y - lastPoint.y) === 1 && !adjacentBeyond) {
			this.state.paths[this.state.currentColor] = [...currentPath, { x, y }];
			return;
		}

		this.findPathToPoint(currentPath[0], { x, y });
	}

	private isAtEndpoint(point: Point, startPoint: Point): boolean {
		const cell = this.state.board[point.y]?.[point.x];
		return !!(
			cell?.isEndpoint &&
			cell.color === this.state.currentColor &&
			(point.x !== startPoint.x || point.y !== startPoint.y)
		);
	}

	private findPathToPoint(start: Point, target: Point): boolean {
		const visited = new Set<string>();
		const queue = [{ point: start, path: [start] }];

		while (queue.length > 0) {
			const { point, path } = queue.shift()!;
			// Check if point is at endpoint
			// TODO: Fix this condition AHHH
			if (path.length > 1 && this.isAtEndpoint(point, start) && target.x !== point.x && target.y !== point.y) {
				continue;
			}

			if (path.length > this.boardSize * this.boardSize || this.checkPathCollision(path)) continue; // Prevent infinite loops
			if (point.x === target.x && point.y === target.y) {
				// Found path
				if (this.state.currentColor) {
					this.state.paths[this.state.currentColor] = path;
				}
				return true;
			}

			visited.add(`${point.x},${point.y}`);

			const neighbors = this.boardGenerator
				.getValidNeighbors(this.state.board, point, visited, true)
				.filter((n) => !path.some((p) => p.x === n.x && p.y === n.y))
				.sort(() => Math.random() - 0.5);

			for (const neighbor of neighbors) {
				queue.push({ point: neighbor, path: [...path, neighbor] });
			}
		}
		return false;
	}

	private checkPathCollision(currentPath: Point[]): boolean {
		// Skip if no current path
		if (!currentPath.length) return false;

		// Check collision with other paths
		for (const [color, path] of Object.entries(this.state.paths)) {
			// Skip checking against current color's path
			if (color === this.state.currentColor) continue;

			// Check if any point in current path intersects with other paths
			const hasCollision = currentPath.some((currentPoint) =>
				path.some((pathPoint) => currentPoint.x === pathPoint.x && currentPoint.y === pathPoint.y)
			);

			if (hasCollision) return true;
		}

		// For currentPath make sure it does not intersect with any endpoint not of same color
		const currentColor = this.state.currentColor;
		const currentPathEnd = currentPath[currentPath.length - 1];
		const currentPathStart = currentPath[0];
		for (let y = 0; y < this.boardSize; y++) {
			for (let x = 0; x < this.boardSize; x++) {
				const cell = this.state.board[y][x];
				if (cell?.isEndpoint && cell.color !== currentColor) {
					if (currentPath.some((p) => p.x === x && p.y === y)) {
						return true;
					}
					if (currentPathStart.x === x && currentPathStart.y === y) {
						return true;
					}
					if (currentPathEnd.x === x && currentPathEnd.y === y) {
						return true;
					}
				}
			}
		}

		return false;
	}

	public endDrag(): boolean {
		this.state.currentColor = null;
		this.state.startPoint = null;
		return this.checkCompletion();
	}

	public handleMouseMove(x: number, y: number): void {
		this.state.mouseX = x;
		this.state.mouseY = y;
	}

	private checkCompletion(): boolean {
		let total = 0;
		for (const path in this.state.paths) {
			total += this.state.paths[path].length;
		}

		return total === this.boardSize * this.boardSize;
	}

	public getState(): GameState {
		return this.state;
	}

	public reset(size?: number): void {
		if (size) this.boardSize = size;
		this.state = this.initializeState();
	}
}

import { Board, GameState, Point } from "./types";

export class FlowFreeGame {
	private state: GameState;
	private boardSize: number;
	private colors: string[];

	constructor(size: number = 5) {
		this.boardSize = size;
		this.colors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff"];
		this.state = this.initializeState();
	}

	private initializeState(): GameState {
		return {
			board: this.generateBoard(),
			paths: {},
			currentColor: null,
			startPoint: null,
			completed: false,
		};
	}

	private generateBoard(): Board {
		const board = Array(this.boardSize)
			.fill(null)
			.map(() => Array(this.boardSize).fill(null));
		const usedPositions = new Set<string>();

		for (let i = 0; i < Math.min(this.colors.length, Math.floor((this.boardSize * this.boardSize) / 2)); i++) {
			for (let j = 0; j < 2; j++) {
				let pos: Point;
				do {
					pos = {
						x: Math.floor(Math.random() * this.boardSize),
						y: Math.floor(Math.random() * this.boardSize),
					};
				} while (usedPositions.has(`${pos.x},${pos.y}`));

				usedPositions.add(`${pos.x},${pos.y}`);
				board[pos.y][pos.x] = {
					color: this.colors[i],
					isEndpoint: true,
				};
			}
		}

		return board;
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

		// Handle endpoint clicks as before
		if (cell?.isEndpoint) {
			this.state.currentColor = cell.color;
			this.state.startPoint = { x, y };
			this.state.paths[cell.color] = [{ x, y }];
		}
	}

	public handleDrag(x: number, y: number): void {
		if (!this.state.currentColor || !this.state.startPoint) return;

		const currentPath = this.state.paths[this.state.currentColor];
		const lastPoint = currentPath[currentPath.length - 1];

		// Check if valid
		if (this.isValidMove(x, y, this.state.currentColor)) {
			// Check if the move is backtracking
			const backtrackIndex = currentPath.findIndex((p) => p.x === x && p.y === y);
			if (backtrackIndex !== -1) {
				this.state.paths[this.state.currentColor] = currentPath.slice(0, backtrackIndex + 1);
			} else {
				// Find endpoints for current color
				const endpoints = this.state.board
					.flatMap((row, i) =>
						row.map((cell, j) => (cell?.color === this.state.currentColor && cell.isEndpoint ? { x: j, y: i } : null))
					)
					.filter((point): point is Point => point !== null);

				// Check if last point is already at an endpoint
				const isAtEndpoint = endpoints.some(
					(ep) => ep.x === lastPoint.x && ep.y === lastPoint.y && ep !== this.state.startPoint // Ensure it's not the start point
				);

				if (isAtEndpoint && currentPath.length > 1) return;

				// Adding move must be adjacent
				if (Math.abs(x - lastPoint.x) + Math.abs(y - lastPoint.y) === 1) {
					this.state.paths[this.state.currentColor] = [...currentPath, { x, y }];
				}
			}
		}
	}

	public endDrag(): void {
		this.state.currentColor = null;
		this.state.startPoint = null;
		this.checkCompletion();
	}

	private checkCompletion(): void {
		// TODO: Implement completion logic
		this.state.completed = false;
	}

	public getState(): GameState {
		return this.state;
	}

	public reset(size?: number): void {
		if (size) this.boardSize = size;
		this.state = this.initializeState();
	}
}

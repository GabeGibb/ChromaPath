import { BoardGenerator } from "./BoardGenerator";
import { Board, GameState, Point } from "./Types";

export class FlowFreeGame {
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
		// Check if dragging has started or mouse is down
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
				} else {
					// If the move is not adjacent or backtracking, find a path to the endpoint with a custom implementation
					// TODO: THIS CAN CRASH EVERYTHING
					const startPoint = currentPath[0];
					const visited = new Set<string>();
					const queue: { point: { x: number; y: number }; path: { x: number; y: number }[] }[] = [
						{ point: startPoint, path: [startPoint] },
					];
					const target = { x, y }; // Define the target endpoint

					while (queue.length > 0) {
						const { point, path } = queue.shift()!;

						// Mark the current point as visited
						visited.add(`${point.x},${point.y}`);

						// If the current point is the target, update the path and exit
						if (point.x === target.x && point.y === target.y) {
							this.state.paths[this.state.currentColor] = path;
							return;
						}

						// Get all valid neighbors that haven't been visited
						const neighbors = this.boardGenerator.getValidNeighbors(this.state.board, point, visited);

						// Add neighbors to the queue with updated paths
						for (const neighbor of neighbors) {
							if (!visited.has(`${neighbor.x},${neighbor.y}`)) {
								queue.push({
									point: neighbor,
									path: [...path, neighbor],
								});
							}
						}
					}
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

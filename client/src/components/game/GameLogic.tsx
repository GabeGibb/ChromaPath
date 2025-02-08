import { Board, GameState, getValidNeighbors, Point } from "@chromapath/shared";

export class ChromaPathGame {
	private state: GameState;
	private boardSize: number = 0;
	// private pastMouseX: number = -1;
	// private pastMouseY: number = -1;

	constructor() {
		this.state = this.initializeState();
	}

	private initializeState(newBoard: Board = []): GameState {
		const endpointGroups = newBoard.reduce((groups, row) => {
			row.forEach((cell) => {
				if (cell?.isEndpoint) {
					if (!groups[cell.pathIndex]) {
						groups[cell.pathIndex] = [];
					}
					groups[cell.pathIndex].push(cell);
				}
			});
			return groups;
		}, {} as Record<number, (typeof newBoard)[0]>);

		const paths = Object.keys(endpointGroups).map(() => []);
		return {
			board: newBoard,
			paths,
			currentPathIndex: null,
			startPoint: null,
			completed: false,
			mouseX: 0,
			mouseY: 0,
		};
	}

	private isValidMove(x: number, y: number, pathIndex: number): boolean {
		const cell = this.state.board[y][x];

		// Check if position is already part of another path
		for (let i = 0; i < this.state.paths.length; i++) {
			const path = this.state.paths[i];
			if (i !== pathIndex && path.some((p) => p.x === x && p.y === y)) {
				return false;
			}
		}

		// Check if the cell is part of the same color or is empty
		if (cell && cell.pathIndex !== pathIndex) {
			return false;
		}

		return true;
	}

	public handleCellClick(x: number, y: number): void {
		console.log("YOW");
		const cell = this.state.board[y][x];
		// Handle endpoint clicks
		if (cell?.isEndpoint) {
			this.state.currentPathIndex = cell.pathIndex;
			this.state.startPoint = { x, y };
			this.state.paths[cell.pathIndex] = [{ x, y }];
		}
		// Check if clicked on any existing path
		for (let i = 0; i < this.state.paths.length; i++) {
			const path = this.state.paths[i];

			// Find the index of the clicked point in this path
			const clickedIndex = path.findIndex((p) => p.x === x && p.y === y);

			if (clickedIndex !== -1) {
				this.state.currentPathIndex = i;
				this.state.startPoint = path[0];
				// Slice up to the clicked point's position + 1, not the path index
				this.state.paths[i] = path.slice(0, clickedIndex + 1);
				return;
			}
		}
	}

	// private findClosestEmptyPoint(x: number, y: number): Point | null {
	// 	const visited = new Set<string>();
	// 	const queue = [{ point: { x, y }, dist: 0 }];

	// 	while (queue.length > 0) {
	// 		const { point, dist } = queue.shift()!;
	// 		const key = `${point.x},${point.y}`;

	// 		if (visited.has(key)) continue;
	// 		visited.add(key);

	// 		// If this point is empty and 1 point away, return it
	// 		if (!this.state.board[point.y]?.[point.x]) {
	// 			return point;
	// 		}

	// 		// Check all adjacent points (up, right, down, left)
	// 		const neighbors = getValidNeighbors(this.state.board, point, visited, true);
	// 		for (const neighbor of neighbors) {
	// 			// Check if within board bounds
	// 			if (neighbor.x >= 0 && neighbor.x < this.boardSize && neighbor.y >= 0 && neighbor.y < this.boardSize) {
	// 				const neighborKey = `${neighbor.x},${neighbor.y}`;
	// 				if (!visited.has(neighborKey)) {
	// 					queue.push({ point: neighbor, dist: dist + 1 });
	// 				}
	// 			}
	// 		}
	// 	}

	// 	return null; // No empty point found
	// }

	public handleDrag(x: number, y: number): void {
		// Prevent unnecessary updates

		// TODO: FIX THIS FOR MOBILE
		// if (this.pastMouseX === this.state.mouseX && this.pastMouseY === this.state.mouseY) return;
		// this.pastMouseX = this.state.mouseX;
		// this.pastMouseY = this.state.mouseY;

		if (this.state.currentPathIndex === null || !this.state.startPoint) return;

		const currentPath = this.state.paths[this.state.currentPathIndex];
		const lastPoint = currentPath[currentPath.length - 1];

		// TODO: Implement nice feature
		// ! THIS DONT WORK
		if (!this.isValidMove(x, y, this.state.currentPathIndex)) {
			return;
			// const lastPoint = this.state.paths[this.state.currentColor][currentPath.length - 1];
			// const closestPoint = this.findClosestEmptyPoint(lastPoint.x, lastPoint.y);
			// if (closestPoint) {
			// 	x = closestPoint.x;
			// 	y = closestPoint.y;
			// } else {
			// 	return;
			// }
		}

		// Handle backtracking
		const backtrackIndex = currentPath.findIndex((p) => p.x === x && p.y === y);
		if (backtrackIndex !== -1) {
			this.state.paths[this.state.currentPathIndex] = currentPath.slice(0, backtrackIndex + 1);
			return;
		}

		// Check if at non-start endpoint
		const isAtEndpoint = this.isAtEndpoint(lastPoint, this.state.startPoint);
		const adjacentBeyond = isAtEndpoint && currentPath.length > 1;

		if (isAtEndpoint && currentPath.length > 1) return;

		// Handle adjacent moves
		if (Math.abs(x - lastPoint.x) + Math.abs(y - lastPoint.y) === 1 && !adjacentBeyond) {
			this.state.paths[this.state.currentPathIndex] = [...currentPath, { x, y }];
			return;
		}

		// TODO: Check if this actually works
		const curPathCopy = [...currentPath];
		for (let i = currentPath.length - 1; i >= 0; i--) {
			const visited = new Set<string>();
			for (const point of currentPath.slice(0, i)) {
				visited.add(`${point.x},${point.y}`);
			}
			if (this.findPathToPoint(currentPath[i], { x, y }, visited)) {
				const path = curPathCopy.slice(0, i).concat(this.state.paths[this.state.currentPathIndex]);
				this.state.paths[this.state.currentPathIndex] = path;

				return;
			}
		}
	}

	private isAtEndpoint(point: Point, startPoint: Point): boolean {
		const cell = this.state.board[point.y]?.[point.x];
		return !!(
			cell?.isEndpoint &&
			cell.pathIndex === this.state.currentPathIndex &&
			(point.x !== startPoint.x || point.y !== startPoint.y)
		);
	}

	private findPathToPoint(start: Point, target: Point, visited = new Set<string>()): boolean {
		// const visited = new Set<string>();
		const queue = [{ point: start, path: [start] }];

		while (queue.length > 0) {
			const { point, path } = queue.shift()!;
			// Check if point is at endpoint

			if (path.length > 1 && this.isAtEndpoint(point, start) && target.x !== point.x && target.y !== point.y) {
				continue;
			}

			if (this.checkPathCollision(path)) continue; // Prevent infinite loops
			if ((point.x === target.x && point.y === target.y) || this.isAtEndpoint(point, start)) {
				// Found path
				if (this.state.currentPathIndex !== null) {
					this.state.paths[this.state.currentPathIndex] = path;
				}
				return true;
			}

			visited.add(`${point.x},${point.y}`);

			// Get valid neighbors that are not in path, visited, or queue
			const neighbors = getValidNeighbors(this.state.board, point, visited, true).filter(
				(n) =>
					!path.some((p) => p.x === n.x && p.y === n.y) &&
					!visited.has(`${n.x},${n.y}`) &&
					!queue.some((q) => q.point.x === n.x && q.point.y === n.y)
			);

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
		for (const [pathIndex, path] of this.state.paths.entries()) {
			// Skip checking against current color's path
			if (pathIndex === this.state.currentPathIndex) continue;

			// Check if any point in current path intersects with other paths
			const hasCollision = currentPath.some((currentPoint) =>
				path.some((pathPoint) => currentPoint.x === pathPoint.x && currentPoint.y === pathPoint.y)
			);

			if (hasCollision) return true;
		}

		// For currentPath make sure it does not intersect with any endpoint not of same color
		const currentPathIndex = this.state.currentPathIndex;
		const currentPathEnd = currentPath[currentPath.length - 1];
		const currentPathStart = currentPath[0];
		for (let y = 0; y < this.boardSize; y++) {
			for (let x = 0; x < this.boardSize; x++) {
				const cell = this.state.board[y][x];
				if (cell?.isEndpoint && cell.pathIndex !== currentPathIndex) {
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
		this.state.currentPathIndex = null;
		this.state.startPoint = null;
		return this.checkCompletion();
	}

	public refreshPaths(): void {
		for (let i = 0; i < this.state.paths.length; i++) {
			this.state.paths[i] = [];
		}
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

	public reset(newBoard: Board): void {
		this.boardSize = newBoard.length;
		this.state = this.initializeState(newBoard);
	}
}

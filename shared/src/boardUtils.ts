import { Board, Point } from "./types";

export function shuffleArray(array: any[]) {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

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

export function getDistancedColorArray(): string[] {
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

export default function getCombinationsArray(totalNumbers: number, numbersPerCombo: number): number[][] {
	const combinations: number[][] = [];
	const combination: number[] = [];

	function generateCombinations(start: number, remaining: number) {
		if (remaining === 0) {
			combinations.push([...combination]);
			return;
		}

		for (let i = start; i <= totalNumbers - 1; i++) {
			combination.push(i);
			generateCombinations(i + 1, remaining - 1);
			combination.pop();
		}
	}

	generateCombinations(0, numbersPerCombo);
	return combinations;
}

export function pathsIntersect(paths: Point[][]): boolean {
	const pointSet = new Set<string>();

	for (const path of paths) {
		for (const point of path) {
			const key = `${point.x},${point.y}`;
			if (pointSet.has(key)) {
				return true;
			}
			pointSet.add(key);
		}
	}

	return false;
}

export function findAllPossiblePaths(board: Board, start: Point, end: Point, minPathLength: number = 3): Point[][] {
	const paths: Point[][] = [];

	function findPathsRecursive(currentPoint: Point, currentPath: Point[], visited: Set<string>) {
		// If we've reached the end point and the path is long enough
		if (currentPoint.x === end.x && currentPoint.y === end.y && currentPath.length >= minPathLength) {
			if (isValidPath(board, currentPath)) {
				paths.push([...currentPath]);
			}
			return;
		}
		const neighbors = getValidNeighbors(board, currentPoint, visited, true);

		// Try each possible move
		for (const neighbor of neighbors) {
			if (isValidPath(board, [...currentPath, neighbor])) {
				const newVisited = new Set(visited);
				newVisited.add(`${neighbor.x},${neighbor.y}`);

				// Recursively explore this path
				currentPath.push(neighbor);
				findPathsRecursive(neighbor, currentPath, newVisited);
				currentPath.pop(); // Backtrack
			}
		}
	}

	// Start the recursive search
	const initialVisited = new Set([`${start.x},${start.y}`]);
	findPathsRecursive(start, [start], initialVisited);

	return paths;
}

export function isValidPath(board: Board, path: Point[]): boolean {
	// * Makes sure each path has 2 adjacent cells at each point except endpoints

	// Check each point in the path
	for (let i = 0; i < path.length; i++) {
		const point = path[i];
		const isEndpoint = board[point.y][point.x]?.isEndpoint;

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
		if (isEndpoint) {
			if (adjacentCount !== 1) {
				// Handle endpoint case
				return false;
			}
		} else {
			if (adjacentCount !== 2 && i !== path.length - 1) {
				// Check last point in the case of non endpoint
				// Handle non endpoint case
				return false;
			}
		}
	}

	return true;
}

export function getEmptyCells(board: Board): Point[] {
	const emptyCells: Point[] = [];
	for (let y = 0; y < board.length; y++) {
		for (let x = 0; x < board[y].length; x++) {
			if (!board[y][x]) {
				emptyCells.push({ x, y });
			}
		}
	}
	return emptyCells;
}

export function getDirection(prev: Point | null, current: Point, next: Point): "straight" | "left" | "right" {
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

export function removeNonEndpoints(board: Board): Board {
	return board.map((row) => row.map((cell) => (cell && cell.isEndpoint ? cell : null)));
}

export function createBoardWithoutPaths(originalBoard: Board, pathsToRemove: number[]): Board {
	const tempBoard: Board = originalBoard.map((row) =>
		row.map((cell) => (cell && !cell.isEndpoint && pathsToRemove.includes(cell.pathIndex) ? null : cell))
	);
	return tempBoard;
}

export function findEndpointsForPath(board: Board, pathIndex: number): [Point, Point] | null {
	const endpoints: Point[] = [];
	for (let y = 0; y < board.length; y++) {
		for (let x = 0; x < board[0].length; x++) {
			const cell = board[y][x];
			if (cell?.pathIndex === pathIndex && cell.isEndpoint) {
				endpoints.push({ x, y });
			}
		}
	}
	return endpoints.length === 2 ? [endpoints[0], endpoints[1]] : null;
}

export function isValidRegionPattern(region: Point[]): boolean {
	// Create a map to easily check cell presence
	const regionMap = new Set(region.map((p) => `${p.x},${p.y}`));

	// Check each cell in the region
	for (const cell of region) {
		// Count adjacent cells that are part of the same region
		let adjacentCount = 0;
		const directions = [
			{ dx: 1, dy: 0 },
			{ dx: -1, dy: 0 },
			{ dx: 0, dy: 1 },
			{ dx: 0, dy: -1 },
		];

		for (const dir of directions) {
			const nx = cell.x + dir.dx;
			const ny = cell.y + dir.dy;
			if (regionMap.has(`${nx},${ny}`)) {
				adjacentCount++;
			}
		}

		// Invalid patterns:
		// 1. More than 2 adjacent cells (would create a branch)
		if (adjacentCount > 2) {
			return false;
		}

		// 2. Check for square patterns (2x2)
		if (isPartOfSquare(cell, regionMap)) {
			return false;
		}

		// 3. Check for T-shapes or cross patterns
		if (isTShapeOrCross(cell, regionMap)) {
			return false;
		}
	}

	return true;
}

export function isPartOfSquare(cell: Point, regionMap: Set<string>): boolean {
	// Check all possible 2x2 squares this cell could be part of
	const squareOffsets = [
		[
			[0, 0],
			[1, 0],
			[0, 1],
			[1, 1],
		], // top-left of square
		[
			[-1, 0],
			[0, 0],
			[-1, 1],
			[0, 1],
		], // top-right of square
		[
			[0, -1],
			[1, -1],
			[0, 0],
			[1, 0],
		], // bottom-left of square
		[
			[-1, -1],
			[0, -1],
			[-1, 0],
			[0, 0],
		], // bottom-right of square
	];

	for (const square of squareOffsets) {
		let squareCount = 0;
		for (const [dx, dy] of square) {
			const key = `${cell.x + dx},${cell.y + dy}`;
			if (regionMap.has(key)) {
				squareCount++;
			}
		}
		// If we found all 4 cells forming a square
		if (squareCount === 4) {
			return true;
		}
	}
	return false;
}

export function isTShapeOrCross(cell: Point, regionMap: Set<string>): boolean {
	// Count adjacent cells in each direction
	const directions = {
		up: regionMap.has(`${cell.x},${cell.y - 1}`),
		down: regionMap.has(`${cell.x},${cell.y + 1}`),
		left: regionMap.has(`${cell.x - 1},${cell.y}`),
		right: regionMap.has(`${cell.x + 1},${cell.y}`),
	};

	const adjacentCount = Object.values(directions).filter(Boolean).length;

	// Check for T-shape (3 adjacent) or cross (4 adjacent)
	return adjacentCount >= 3;
}

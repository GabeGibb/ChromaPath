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
	const queue: {
		point: Point;
		path: Point[];
		visited: Set<string>;
	}[] = [
		{
			point: start,
			path: [start],
			visited: new Set([`${start.x},${start.y}`]),
		},
	];

	while (queue.length > 0) {
		const { point, path, visited } = queue.shift()!;

		if (point.x === end.x && point.y === end.y && path.length >= minPathLength) {
			if (isValidPath(path)) {
				paths.push(path);
			}
			continue;
		}

		// Get all valid neighbors
		const validMoves = [
			{ x: -1, y: 0 },
			{ x: 1, y: 0 },
			{ x: 0, y: -1 },
			{ x: 0, y: 1 },
		];

		for (const move of validMoves) {
			const newX = point.x + move.x;
			const newY = point.y + move.y;
			const newKey = `${newX},${newY}`;

			// Check if the move is valid and not visited in this path
			if (
				newX >= 0 &&
				newX < board.length &&
				newY >= 0 &&
				newY < board[0].length &&
				!visited.has(newKey) &&
				(board[newY][newX] === null || (newX === end.x && newY === end.y))
			) {
				// Create new visited set for this path
				const newVisited = new Set(visited);
				newVisited.add(newKey);

				queue.push({
					point: { x: newX, y: newY },
					path: [...path, { x: newX, y: newY }],
					visited: newVisited,
				});
			}
		}
	}
	return paths;
}

export function isValidPath(path: Point[]): boolean {
	// Check each point in the path
	for (let i = 0; i < path.length; i++) {
		const point = path[i];
		const isEndpoint = i === 0 || i === path.length - 1;

		if (!isEndpoint) {
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

			// Non-endpoint cells should have exactly 2 adjacent cells
			if (adjacentCount !== 2) {
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

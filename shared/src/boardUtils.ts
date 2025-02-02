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

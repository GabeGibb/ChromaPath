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

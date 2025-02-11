import getCombinationsArray, {
	createBoardWithoutPaths,
	findAllPossiblePaths,
	findEndpointsForPath,
	getEmptyCells,
	pathsIntersect,
} from "../../boardUtils";
import { Board, Point } from "../../types";

export function doesPathCombinationHaveRemainingEmptyCells(board: Board, paths: Point[][]): boolean {
	// Calculate total space used by paths
	const totalSpaceAvailable = getEmptyCells(board).length;
	const totalPathLength = paths.reduce((sum, path) => sum + path.length, 0);
	// Check if paths use all available space
	if (totalPathLength !== totalSpaceAvailable) {
		console.log("FILTERED OUT BAD DOH");
	}
	// return false;
	return totalPathLength !== totalSpaceAvailable;
}

export function doesPathCombinationIntersect(paths: Point[][]): boolean {
	for (let i = 0; i < paths.length; i++) {
		for (let j = i + 1; j < paths.length; j++) {
			if (pathsIntersect(paths)) {
				return true;
			}
		}
	}
	return false;
}

export function generatePathCombinations(paths: Point[][], numPaths: number): Point[][][] {
	const results: Point[][][] = [];

	const generate = (current: Point[][], start: number) => {
		if (current.length === numPaths) {
			results.push([...current]);
			return;
		}

		for (let i = start; i < paths.length; i++) {
			current.push(paths[i]);
			generate(current, i + 1);
			current.pop();
		}
	};

	generate([], 0);
	return results;
}

// TODO: POTENTIALLY BROKEN!!
export function pathsHaveBetterSolution(board: Board, numPaths: number): boolean {
	const boardCopy = board.map((row) => row.map((cell) => cell));
	const numPathsToRemove = 2;
	const pathCombinations = getCombinationsArray(numPaths, numPathsToRemove);

	for (const pathsToRemove of pathCombinations) {
		board = createBoardWithoutPaths(boardCopy, pathsToRemove);

		// Get all endpoints for removed paths
		const endpointPairs: Array<[Point, Point]> = [];
		for (const pathIndex of pathsToRemove) {
			const endpoints = findEndpointsForPath(board, pathIndex);
			if (!endpoints) continue;
			endpointPairs.push(endpoints);
		}

		// Find all possible paths for each endpoint pair
		const allPossiblePaths: Point[][] = [];
		for (const [start, end] of endpointPairs) {
			const paths = findAllPossiblePaths(board, start, end);
			if (paths.length === 0) continue;
			allPossiblePaths.push(...paths);
		}

		// Generate all possible combinations of paths
		const pathCombos = generatePathCombinations(allPossiblePaths, endpointPairs.length);

		// Check each combination
		for (const pathCombo of pathCombos) {
			if (doesPathCombinationIntersect(pathCombo)) {
				continue;
			}

			for (const path of pathCombo) {
				for (const point of path) {
					board[point.y][point.x] = null;
				}
			}

			if (doesPathCombinationHaveRemainingEmptyCells(board, pathCombo)) {
				return true;
			}
		}
	}

	board = boardCopy;
	return false;
}

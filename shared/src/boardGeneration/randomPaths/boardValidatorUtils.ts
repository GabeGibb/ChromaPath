import getCombinationsArray, {
	countAdjacent,
	createBoardWithoutPaths,
	doPathsIntersect,
	findEndpointsForPath,
	getEmptyCells,
	getValidNeighbors,
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
			if (doPathsIntersect(paths)) {
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
	const start = performance.now();
	const boardCopy = board.map((row) => row.map((cell) => cell));
	const numPathsToRemove = 2;
	const pathCombinations = getCombinationsArray(numPaths, numPathsToRemove);

	for (const pathsToRemove of pathCombinations) {
		board = createBoardWithoutPaths(boardCopy, pathsToRemove);

		// Get all endpoints for removed paths
		const endpointPairs: Array<[Point, Point, number]> = [];
		for (const pathIndex of pathsToRemove) {
			const endpoints = findEndpointsForPath(board, pathIndex);
			if (!endpoints) continue;
			endpointPairs.push([...endpoints, pathIndex]);
		}

		if (canEndpointsBeConnectedWithEmptyCells(board, endpointPairs)) {
			console.log("TIME FOR VALIDATION: ", (performance.now() - start) / 1000);
			return true;
		}

		// // Find all possible paths for each endpoint pair
		// const allPossiblePaths: Point[][] = [];
		// for (const [start, end] of endpointPairs) {
		// 	const paths = findAllPossiblePaths(board, start, end);
		// 	if (paths.length === 0) continue;
		// 	allPossiblePaths.push(...paths);
		// }

		// // Generate all possible combinations of paths
		// const pathCombos = generatePathCombinations(allPossiblePaths, endpointPairs.length);

		// // Check each combination
		// for (const pathCombo of pathCombos) {
		// 	if (doesPathCombinationIntersect(pathCombo)) {
		// 		continue;
		// 	}

		// 	for (const path of pathCombo) {
		// 		for (const point of path) {
		// 			board[point.y][point.x] = null;
		// 		}
		// 	}
		// 	if (doesPathCombinationHaveRemainingEmptyCells(board, pathCombo)) {
		// 		console.log("TIME FOR VALIDATION: ", (performance.now() - start) / 1000);
		// 		return true;
		// 	}
		// }
	}
	console.log("TIME FOR VALIDATION: ", (performance.now() - start) / 1000);
	board = boardCopy;
	return false;
}

function canEndpointsBeConnectedWithEmptyCells(board: Board, endpointPairs: Array<[Point, Point, number]>): boolean {
	// This function takes in n pairs of endpoints and checks if they can be connected with empty cells
	// It will do this by generating paths between each pair recursively and backtracking on conflicts

	const curPaths: Point[][] = endpointPairs.map(([start]) => [start]);

	function recursivePathsReachedEmptySolution(curEndpointPairIndex: number): boolean {
		if (curEndpointPairIndex === endpointPairs.length) {
			curEndpointPairIndex = 0;
		}

		const curPath = curPaths[curEndpointPairIndex];
		const curPoint = curPath[curPath.length - 1];
		const endPoint = endpointPairs[curEndpointPairIndex][1];
		const pathIndex = endpointPairs[curEndpointPairIndex][2];

		// Check if we've reached the target for this path
		if (curPoint.x === endPoint.x && curPoint.y === endPoint.y) {
			// Try to solve remaining paths
			// TODO: Does this do what I want
			return recursivePathsReachedEmptySolution(curEndpointPairIndex + 1);
		}

		// Get valid neighbors for the current point
		const neighbors = getValidNeighbors(board, curPoint, new Set<string>(), true);
		// If the target point in neighbors remove all other neighbors
		if (neighbors.some((n) => n.x === endPoint.x && n.y === endPoint.y)) {
			neighbors.splice(0, neighbors.length, endPoint);
		} else {
			// Check if the neighbor has more than one adjacent cell of the same path
			neighbors.forEach((neighbor, index) => {
				const adjacents = countAdjacent(curPath, neighbor);
				if (adjacents > 1) {
					neighbors.splice(index, 1);
				}
			});
		}

		//TODO: Zone checks or path way checks?? Something to further filter down

		// This path is bad, backtrack
		if (neighbors.length === 0) {
			return false;
		}

		// Try each possible move
		for (const neighbor of neighbors) {
			// Mark cell as visited
			curPath.push(neighbor);
			board[neighbor.y][neighbor.x] = { pathIndex, isEndpoint: false };

			// Recursively try to solve with this move
			if (recursivePathsReachedEmptySolution(curEndpointPairIndex + 1)) {
				return true;
			}

			// Backtrack: remove the neighbor and try other options
			curPath.pop();
			board[neighbor.y][neighbor.x] = null;
		}
		console.log(curPaths);

		return false;
	}

	// Start the recursive path finding and return the result
	return recursivePathsReachedEmptySolution(0);
}

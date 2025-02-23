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
export type Solution = Point[][];

function findAllSolutions(board: Board, endpointPairs: Array<[Point, Point, number]>): Solution[] {
	const solutions: Solution[] = [];
	// Initialize paths with just start points
	const curPaths: Point[][] = endpointPairs.map(([start]) => [start]);

	function isValidMove(point: Point, pathIndex: number, curPath: Point[], board: Board): boolean {
		// Check if cell is already occupied by another path
		if (board[point.y][point.x]?.pathIndex !== undefined && board[point.y][point.x]?.pathIndex !== pathIndex) {
			return false;
		}

		// Check for adjacent cells from same path (no self-crossing)
		const adjacentCount = countAdjacent(curPath, point);
		if (adjacentCount > 1) {
			return false;
		}

		return true;
	}

	function makeMove(point: Point, pathIndex: number, board: Board): void {
		board[point.y][point.x] = { pathIndex, isEndpoint: false };
	}

	function undoMove(point: Point, board: Board): void {
		board[point.y][point.x] = null;
	}

	function getNextValidMoves(
		board: Board,
		paths: Point[][],
		endpointPairs: Array<[Point, Point, number]>
	): Array<{ pathIndex: number; point: Point }> {
		const validMoves: Array<{ pathIndex: number; point: Point }> = [];

		for (let pathIndex = 0; pathIndex < paths.length; pathIndex++) {
			const path = paths[pathIndex];
			const curPoint = path[path.length - 1];
			const [_, endPoint] = endpointPairs[pathIndex];

			// Skip if this path is already complete
			if (curPoint.x === endPoint.x && curPoint.y === endPoint.y) {
				continue;
			}

			const neighbors = getValidNeighbors(board, curPoint, new Set<string>(), true).filter((neighbor) => {
				if (!isValidMove(neighbor, pathIndex, path, board)) {
					return false;
				}

				// Allow reaching endpoint
				if (neighbor.x === endPoint.x && neighbor.y === endPoint.y) {
					return true;
				}

				// Check if move would block other paths
				return !wouldBlockOtherPaths(board, neighbor, endpointPairs, pathIndex);
			});

			for (const neighbor of neighbors) {
				validMoves.push({ pathIndex, point: neighbor });
			}
		}

		return validMoves;
	}

	function isComplete(paths: Point[][], endpointPairs: Array<[Point, Point, number]>): boolean {
		return paths.every((path, index) => {
			const endPoint = endpointPairs[index][1];
			const lastPoint = path[path.length - 1];
			return lastPoint.x === endPoint.x && lastPoint.y === endPoint.y;
		});
	}

	function recursiveSolve(board: Board): boolean {
		// If all paths are complete, we've found a solution
		if (isComplete(curPaths, endpointPairs)) {
			if (doesPathCombinationHaveRemainingEmptyCells(board, curPaths)) {
				solutions.push(curPaths.map((path) => [...path]));
				return false;
			}
			return true;
		}

		// Get all valid moves for all incomplete paths
		const validMoves = getNextValidMoves(board, curPaths, endpointPairs);

		// Try each valid move
		for (const { pathIndex, point } of validMoves) {
			// Make the move
			curPaths[pathIndex].push(point);
			makeMove(point, pathIndex, board);

			// Recurse
			if (!recursiveSolve(board)) {
				return false;
			}

			// Undo the move
			curPaths[pathIndex].pop();
			undoMove(point, board);
		}
		return true;
	}

	// Start the recursive search
	recursiveSolve(board);
	return solutions;
}

// Updated function to use the new solver
function canEndpointsBeConnectedWithEmptyCells(board: Board, endpointPairs: Array<[Point, Point, number]>): boolean {
	const solutions = findAllSolutions(board, endpointPairs);
	return solutions.length > 0;
}
// Helper function to check if a move would block other paths from reaching their endpoints
function wouldBlockOtherPaths(
	board: Board,
	point: Point,
	endpointPairs: Array<[Point, Point, number]>,
	currentPairIndex: number
): boolean {
	// Simple flood fill check for each remaining endpoint pair
	for (let i = currentPairIndex + 1; i < endpointPairs.length; i++) {
		const [start, end] = endpointPairs[i];

		// Create a temporary board copy with the proposed move
		const tempBoard = board.map((row) => [...row]);
		tempBoard[point.y][point.x] = { pathIndex: -1, isEndpoint: false };

		// Check if there's still a possible path between start and end
		if (!hasPathBetweenPoints(tempBoard, start, end)) {
			return true;
		}
	}
	return false;
}

// Helper function to check if a path exists between two points
function hasPathBetweenPoints(board: Board, start: Point, end: Point): boolean {
	const visited = new Set<string>();
	const queue: Point[] = [start];

	while (queue.length > 0) {
		const current = queue.shift()!;
		const key = `${current.x},${current.y}`;

		if (current.x === end.x && current.y === end.y) {
			return true;
		}

		if (visited.has(key)) continue;
		visited.add(key);

		const neighbors = getValidNeighbors(board, current, visited, false);
		queue.push(...neighbors);
	}

	return false;
}

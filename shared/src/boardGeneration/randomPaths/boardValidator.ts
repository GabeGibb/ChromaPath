import { getEmptyCells, pathsIntersect } from "../../boardUtils";
import { Board, Point } from "../../types";

export default function boardIsValid(board: Board): boolean {
	return true;
}

export function isValidPathCombination(board: Board, paths: Point[][]): boolean {
	// Check if paths intersect
	for (let i = 0; i < paths.length; i++) {
		for (let j = i + 1; j < paths.length; j++) {
			if (pathsIntersect(paths)) {
				return false;
			}
		}
	}

	// Calculate total space used by paths
	const totalSpaceAvailable = getEmptyCells(board).length;
	const totalPathLength = paths.reduce((sum, path) => sum + path.length, 0);

	// Check if paths use all available space
	if (totalPathLength !== totalSpaceAvailable) {
		console.log("FILTERED OUT BAD DOH");
	}
	// return false;
	return totalPathLength === totalSpaceAvailable;
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

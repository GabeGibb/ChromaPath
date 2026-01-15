import {
  getCombinationsArray,
  createBoardWithoutPaths,
  doPathsIntersect,
  findAllPossiblePaths,
  findEndpointsForPath,
  getEmptyCells,
} from "../boardUtils";
import { Board, Point } from "../types";

export function doesPathCombinationHaveRemainingEmptyCells(
  board: Board,
  paths: Point[][]
): boolean {
  const totalSpaceAvailable = getEmptyCells(board).length;
  const totalPathLength = paths.reduce((sum, path) => sum + path.length, 0);
  return totalPathLength !== totalSpaceAvailable;
}

export function doesPathCombinationIntersect(paths: Point[][]): boolean {
  for (let i = 0; i < paths.length; i++) {
    for (let j = i + 1; j < paths.length; j++) {
      if (doPathsIntersect([paths[i], paths[j]])) {
        return true;
      }
    }
  }
  return false;
}

export function generatePathCombinations(
  paths: Point[][],
  numPaths: number
): Point[][][] {
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

export function pathsHaveBetterSolution(
  board: Board,
  numPaths: number
): boolean {
  const boardCopy = board.map((row) => row.map((cell) => cell));
  const numPathsToRemove = 2;

  const pathCombinations = getCombinationsArray(numPaths, numPathsToRemove);

  for (const pathsToRemove of pathCombinations) {
    board = createBoardWithoutPaths(boardCopy, pathsToRemove);

    const endpointPairs: Array<[Point, Point, number]> = [];
    for (const pathIndex of pathsToRemove) {
      const endpoints = findEndpointsForPath(board, pathIndex);
      if (!endpoints) continue;
      endpointPairs.push([...endpoints, pathIndex]);
    }

    const allPossiblePaths: Point[][] = [];
    for (const [start, end] of endpointPairs) {
      const paths = findAllPossiblePaths(board, start, end, endpointPairs);
      if (paths.length === 0) continue;
      allPossiblePaths.push(...paths);
    }

    // Early exit: no paths found means no alternative solutions possible
    if (allPossiblePaths.length === 0) continue;

    const pathCombos = generatePathCombinations(
      allPossiblePaths,
      endpointPairs.length
    );

    for (const pathCombo of pathCombos) {
      if (doesPathCombinationIntersect(pathCombo)) {
        continue;
      }

      for (const path of pathCombo) {
        for (const point of path) {
          board[point.y][point.x] = null;
        }
      }

      const hasRemainingCells = doesPathCombinationHaveRemainingEmptyCells(
        board,
        pathCombo
      );

      if (hasRemainingCells) {
        return true;
      }
    }
  }

  return false;
}

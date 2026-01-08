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
      if (doPathsIntersect(paths)) {
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

class SimpleProfiler {
  private timestamps: Map<string, number>;
  private durations: Map<string, number>;

  constructor() {
    this.timestamps = new Map();
    this.durations = new Map();
  }

  start(label: string) {
    this.timestamps.set(label, performance.now());
  }

  end(label: string) {
    const start = this.timestamps.get(label);
    if (start === undefined) {
      console.warn(`No start time found for ${label}`);
      return;
    }
    const duration = performance.now() - start;
    this.durations.set(label, (this.durations.get(label) || 0) + duration);
  }

  summary() {
    const results = Array.from(this.durations.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, duration]) => `${label}: ${(duration / 1000).toFixed(3)}s`);
    console.log("Performance Summary:\n" + results.join("\n"));
  }
}

export function pathsHaveBetterSolution(
  board: Board,
  numPaths: number
): boolean {
  const profiler = new SimpleProfiler();
  profiler.start("total");

  const boardCopy = board.map((row) => row.map((cell) => cell));
  const numPathsToRemove = 2;

  profiler.start("getCombinations");
  const pathCombinations = getCombinationsArray(numPaths, numPathsToRemove);
  profiler.end("getCombinations");

  for (const pathsToRemove of pathCombinations) {
    profiler.start("createBoardWithoutPaths");
    board = createBoardWithoutPaths(boardCopy, pathsToRemove);
    profiler.end("createBoardWithoutPaths");

    profiler.start("findEndpoints");
    const endpointPairs: Array<[Point, Point, number]> = [];
    for (const pathIndex of pathsToRemove) {
      const endpoints = findEndpointsForPath(board, pathIndex);
      if (!endpoints) continue;
      endpointPairs.push([...endpoints, pathIndex]);
    }
    profiler.end("findEndpoints");

    profiler.start("findAllPaths");
    const allPossiblePaths: Point[][] = [];
    for (const [start, end] of endpointPairs) {
      const paths = findAllPossiblePaths(board, start, end, endpointPairs);
      if (paths.length === 0) continue;
      allPossiblePaths.push(...paths);
    }
    profiler.end("findAllPaths");

    profiler.start("generateCombinations");
    const pathCombos = generatePathCombinations(
      allPossiblePaths,
      endpointPairs.length
    );
    profiler.end("generateCombinations");

    for (const pathCombo of pathCombos) {
      profiler.start("intersectionCheck");
      const intersects = doesPathCombinationIntersect(pathCombo);
      profiler.end("intersectionCheck");

      if (intersects) {
        continue;
      }

      profiler.start("boardUpdate");
      for (const path of pathCombo) {
        for (const point of path) {
          board[point.y][point.x] = null;
        }
      }
      profiler.end("boardUpdate");

      profiler.start("remainingCellsCheck");
      const hasRemainingCells = doesPathCombinationHaveRemainingEmptyCells(
        board,
        pathCombo
      );
      profiler.end("remainingCellsCheck");

      if (hasRemainingCells) {
        profiler.end("total");
        return true;
      }
    }
  }

  profiler.end("total");
  board = boardCopy;
  return false;
}

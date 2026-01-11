import { Board, Point } from "./types";

// Pre-defined direction offsets (avoid recreating on every call)
const NEIGHBOR_DX = [0, 1, 0, -1];
const NEIGHBOR_DY = [-1, 0, 1, 0];

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function getValidNeighbors(
  board: Board,
  point: Point,
  visited: Set<string>,
  includeEndpoint: boolean = false
): Point[] {
  const boardHeight = board.length;
  const boardWidth = boardHeight > 0 ? board[0].length : 0;
  const result: Point[] = [];

  for (let i = 0; i < 4; i++) {
    const x = point.x + NEIGHBOR_DX[i];
    const y = point.y + NEIGHBOR_DY[i];

    if (
      x >= 0 &&
      x < boardWidth &&
      y >= 0 &&
      y < boardHeight &&
      (!board[y][x] || (includeEndpoint && board[y][x]?.isEndpoint)) &&
      !visited.has(`${x},${y}`)
    ) {
      result.push({ x, y });
    }
  }

  return result;
}

export function getDistancedColorArray(): string[] {
  function maximizePairwiseDistance(): string[] {
    const colors: number[][] = [];

    // Generate permutations of high and low RGB values
    const levels = [0, 255, 170, 85, 127.5];
    for (const r of levels) {
      for (const g of levels) {
        for (const b of levels) {
          // If 2 or more values are 0, skip
          if (r === 0 && g === 0) continue;
          if (r === 0 && b === 0) continue;
          if (g === 0 && b === 0) continue;

          colors.push([r, g, b]);
        }
      }
    }

    // Select all available colors, maximizing pairwise distance
    const selectedColors: number[][] = [];
    selectedColors.push(colors[0]);

    for (let i = 0; i < colors.length; i++) {
      let maxDistance = 0;
      let nextColor: number[] | null = null;

      for (const color of colors) {
        const minDistanceToSet = Math.min(
          ...selectedColors.map((c) => distance3D(c, color))
        );

        if (minDistanceToSet > maxDistance) {
          maxDistance = minDistanceToSet;
          nextColor = color;
        }
      }

      if (nextColor) {
        selectedColors.push(nextColor);
        colors.splice(colors.indexOf(nextColor), 1);
      }
    }

    return selectedColors.map(([r, g, b]) => `rgb(${r}, ${g}, ${b})`);
  }

  function distance3D(a: number[], b: number[]): number {
    return Math.sqrt(
      Math.pow(a[0] - b[0], 2) +
        Math.pow(a[1] - b[1], 2) +
        Math.pow(a[2] - b[2], 2)
    );
  }

  const colors = maximizePairwiseDistance();
  return colors;
}

export function getCombinationsArray(
  totalNumbers: number,
  numbersPerCombo: number
): number[][] {
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

export function doPathsIntersect(paths: Point[][]): boolean {
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

export function findAllPossiblePaths(
  board: Board,
  start: Point,
  end: Point,
  endpointPairs: Array<[Point, Point, number]>
): Point[][] {
  const paths: Point[][] = [];
  const endpointIndex = endpointPairs.findIndex(
    ([startPoint, endPoint]) =>
      startPoint.x === start.x &&
      startPoint.y === start.y &&
      endPoint.x === end.x &&
      endPoint.y === end.y
  );

  // Use single visited set with backtracking (add before, delete after)
  const visited = new Set<string>();
  visited.add(`${start.x},${start.y}`);

  function findPathsRecursive(
    currentPoint: Point,
    currentPath: Point[]
  ) {
    if (
      currentPoint.x === end.x &&
      currentPoint.y === end.y &&
      currentPath.length >= 3
    ) {
      if (isValidPath(board, currentPath)) {
        paths.push([...currentPath]);
      }
      return;
    }
    const neighbors = getValidNeighbors(board, currentPoint, visited, true);

    for (const neighbor of neighbors) {
      // Build extended path for checks
      currentPath.push(neighbor);

      if (isValidPath(board, currentPath)) {
        if (
          !wouldBlockOtherPaths(
            board,
            currentPath,
            endpointPairs,
            endpointIndex
          )
        ) {
          // Backtracking: add to visited, recurse, then remove
          const neighborKey = `${neighbor.x},${neighbor.y}`;
          visited.add(neighborKey);
          findPathsRecursive(neighbor, currentPath);
          visited.delete(neighborKey);
        }
      }

      currentPath.pop();
    }
  }

  findPathsRecursive(start, [start]);

  return paths;
}

function wouldBlockOtherPaths(
  board: Board,
  proposedPath: Point[],
  endpointPairs: Array<[Point, Point, number]>,
  currentPairIndex: number
): boolean {
  // Save original values and apply path (avoid full board copy)
  const originalValues: Array<{ point: Point; value: Board[0][0] }> = [];
  for (const point of proposedPath) {
    originalValues.push({ point, value: board[point.y][point.x] });
    board[point.y][point.x] = { pathIndex: -1, isEndpoint: false };
  }

  let wouldBlock = false;
  for (let i = 0; i < endpointPairs.length; i++) {
    if (i === currentPairIndex) continue;

    const [start, end] = endpointPairs[i];

    if (!findPathToPoint(board, start, end)) {
      wouldBlock = true;
      break;
    }
  }

  // Restore original values
  for (const { point, value } of originalValues) {
    board[point.y][point.x] = value;
  }

  return wouldBlock;
}

function findPathToPoint(
  board: Board,
  start: Point,
  target: Point,
  visited = new Set<string>()
): boolean {
  // BFS using index instead of shift() - O(1) instead of O(n)
  const queue: { point: Point; depth: number }[] = [{ point: start, depth: 0 }];
  let queueIndex = 0;

  while (queueIndex < queue.length) {
    const { point, depth } = queue[queueIndex++];

    if (depth > 0 && point.x === target.x && point.y === target.y) {
      return true;
    }

    const pointKey = `${point.x},${point.y}`;
    if (visited.has(pointKey)) continue;
    visited.add(pointKey);

    const neighbors = getValidNeighbors(board, point, visited, true);

    for (const neighbor of neighbors) {
      const neighborKey = `${neighbor.x},${neighbor.y}`;
      if (!visited.has(neighborKey)) {
        queue.push({ point: neighbor, depth: depth + 1 });
      }
    }
  }

  return false;
}

const adjacentDirections = [
  { x: -1, y: 0 },
  { x: 1, y: 0 },
  { x: 0, y: -1 },
  { x: 0, y: 1 },
];

// O(1) lookup version using pre-built Set (string keys - for compatibility)
export function countAdjacentWithSet(pathSet: Set<string>, point: Point): number {
  let adjacentCount = 0;
  for (const dir of adjacentDirections) {
    const key = `${point.x + dir.x},${point.y + dir.y}`;
    if (pathSet.has(key)) {
      adjacentCount++;
    }
  }
  return adjacentCount;
}

// Fast numeric version - avoids string allocation
function countAdjacentNumeric(pathSet: Set<number>, x: number, y: number, width: number): number {
  let count = 0;
  for (const dir of adjacentDirections) {
    const key = (y + dir.y) * width + (x + dir.x);
    if (pathSet.has(key)) count++;
  }
  return count;
}

// Legacy O(n) version - kept for compatibility
export function countAdjacent(path: Point[], point: Point): number {
  let adjacentCount = 0;
  for (const dir of adjacentDirections) {
    const checkX = point.x + dir.x;
    const checkY = point.y + dir.y;
    if (path.some((p) => p.x === checkX && p.y === checkY)) {
      adjacentCount++;
    }
  }
  return adjacentCount;
}

// Optimized version - uses numeric keys instead of string keys
export function isValidPath(board: Board, path: Point[]): boolean {
  const boardWidth = board[0]?.length || 0;

  // Build numeric set once - O(n), but faster than string version
  const pathSet = new Set<number>();
  for (const p of path) {
    pathSet.add(p.y * boardWidth + p.x);
  }

  for (let i = 0; i < path.length; i++) {
    const point = path[i];
    const isEndpoint = board[point.y][point.x]?.isEndpoint;

    // O(1) lookup with numeric keys
    const adjacentCount = countAdjacentNumeric(pathSet, point.x, point.y, boardWidth);

    if (isEndpoint) {
      if (adjacentCount !== 1) {
        return false;
      }
    } else {
      if (adjacentCount !== 2 && i !== path.length - 1) {
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

export function getDirection(
  prev: Point | null,
  current: Point,
  next: Point
): "straight" | "left" | "right" {
  if (!prev) return "straight";

  const currentDx = current.x - prev.x;
  const currentDy = current.y - prev.y;

  const nextDx = next.x - current.x;
  const nextDy = next.y - current.y;

  if (currentDx === nextDx && currentDy === nextDy) {
    return "straight";
  }

  if (currentDx !== 0) {
    return nextDy > 0 ? "right" : "left";
  } else {
    return nextDx > 0 ? "left" : "right";
  }
}

export function removeNonEndpoints(board: Board): Board {
  return board.map((row) =>
    row.map((cell) => (cell && cell.isEndpoint ? cell : null))
  );
}

export function createBoardWithoutPaths(
  originalBoard: Board,
  pathsToRemove: number[]
): Board {
  const tempBoard: Board = originalBoard.map((row) =>
    row.map((cell) =>
      cell && !cell.isEndpoint && pathsToRemove.includes(cell.pathIndex)
        ? null
        : cell
    )
  );
  return tempBoard;
}

export function findEndpointsForPath(
  board: Board,
  pathIndex: number
): [Point, Point] | null {
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

// Fast check: would adding a point to the path create isolated cells?
// An isolated cell is an empty cell with 0 empty neighbors after the path blocks it
// Pass pathSet as parameter to avoid recreating it for each neighbor
export function wouldCreateIsolatedCells(
  board: Board,
  pathSet: Set<string>,
  newPoint: Point
): boolean {
  const boardHeight = board.length;
  const boardWidth = board[0]?.length || 0;

  const newPointKey = `${newPoint.x},${newPoint.y}`;

  // Check all neighbors of the new point - they might become isolated
  for (const dir of adjacentDirections) {
    const nx = newPoint.x + dir.x;
    const ny = newPoint.y + dir.y;

    // Skip if out of bounds, occupied, or part of path (including new point)
    if (nx < 0 || nx >= boardWidth || ny < 0 || ny >= boardHeight) continue;
    if (board[ny][nx]) continue; // Already occupied
    const neighborKey = `${nx},${ny}`;
    if (pathSet.has(neighborKey) || neighborKey === newPointKey) continue; // Part of our path

    // Count empty neighbors of this cell (excluding the path AND the new point)
    let emptyNeighborCount = 0;
    for (const dir2 of adjacentDirections) {
      const nnx = nx + dir2.x;
      const nny = ny + dir2.y;
      if (nnx < 0 || nnx >= boardWidth || nny < 0 || nny >= boardHeight) continue;
      if (board[nny][nnx]) continue; // Occupied
      const nnKey = `${nnx},${nny}`;
      if (pathSet.has(nnKey) || nnKey === newPointKey) continue; // Part of path or new point
      emptyNeighborCount++;
    }

    // If this cell would have 0 empty neighbors, it's isolated
    if (emptyNeighborCount === 0) {
      return true;
    }
  }

  return false;
}

// Count how many cells would become "bottlenecked" (only 1 empty neighbor)
// if we add newPoint to the path
// Pass pathSet as parameter to avoid recreating it for each neighbor
export function countBottleneckedCells(
  board: Board,
  pathSet: Set<string>,
  newPoint: Point
): number {
  const boardHeight = board.length;
  const boardWidth = board[0]?.length || 0;
  const newPointKey = `${newPoint.x},${newPoint.y}`;

  let bottlenecked = 0;

  // Check all neighbors of the new point
  for (const dir of adjacentDirections) {
    const nx = newPoint.x + dir.x;
    const ny = newPoint.y + dir.y;

    if (nx < 0 || nx >= boardWidth || ny < 0 || ny >= boardHeight) continue;
    if (board[ny][nx]) continue;
    const neighborKey = `${nx},${ny}`;
    if (pathSet.has(neighborKey) || neighborKey === newPointKey) continue; // Include newPoint

    let emptyNeighborCount = 0;
    for (const dir2 of adjacentDirections) {
      const nnx = nx + dir2.x;
      const nny = ny + dir2.y;
      if (nnx < 0 || nnx >= boardWidth || nny < 0 || nny >= boardHeight) continue;
      if (board[nny][nnx]) continue;
      const nnKey = `${nnx},${nny}`;
      if (pathSet.has(nnKey) || nnKey === newPointKey) continue;
      emptyNeighborCount++;
    }

    if (emptyNeighborCount === 1) {
      bottlenecked++;
    }
  }

  return bottlenecked;
}

/**
 * Measure region size up to a limit using BFS.
 * Returns the actual size if < limit, or 0 if >= limit (meaning "big enough").
 * This is used for quick dead-end detection without fully exploring large regions.
 */
export function measureRegionSize(
  board: Board,
  start: Point,
  blocked: Set<string>,
  limit: number
): number {
  const boardHeight = board.length;
  const boardWidth = board[0]?.length || 0;
  const visited = new Set<string>();
  const queue: Point[] = [start];
  let size = 0;

  while (queue.length > 0 && size < limit) {
    const point = queue.shift()!;
    const key = `${point.x},${point.y}`;

    if (visited.has(key)) continue;
    visited.add(key);
    size++;

    for (const dir of adjacentDirections) {
      const nx = point.x + dir.x;
      const ny = point.y + dir.y;

      if (nx < 0 || nx >= boardWidth || ny < 0 || ny >= boardHeight) continue;
      if (board[ny][nx]) continue; // Occupied cell
      const neighborKey = `${nx},${ny}`;
      if (blocked.has(neighborKey) || visited.has(neighborKey)) continue;

      queue.push({ x: nx, y: ny });
    }
  }

  return size >= limit ? 0 : size; // 0 means "at least limit"
}

/**
 * Check if adding a point would create an unsolvable board state.
 * Uses constraint propagation to detect:
 * 1. Isolated cells (0 empty neighbors)
 * 2. Regions too small to fit minimum path length (3)
 */
export function wouldCreateDeadEnd(
  board: Board,
  pathSet: Set<string>,
  newPoint: Point,
  minPathLength: number = 3
): boolean {
  // Check 1: Would create isolated cells?
  if (wouldCreateIsolatedCells(board, pathSet, newPoint)) {
    return true;
  }

  // Check 2: Would create too-small regions? (disabled for now - may be too slow)
  // TODO: Re-enable after optimizing measureRegionSize
  // const boardHeight = board.length;
  // const boardWidth = board[0]?.length || 0;
  // const newPointKey = `${newPoint.x},${newPoint.y}`;
  // const blocked = new Set(pathSet);
  // blocked.add(newPointKey);
  // for (const dir of adjacentDirections) {
  //   const nx = newPoint.x + dir.x;
  //   const ny = newPoint.y + dir.y;
  //   if (nx < 0 || nx >= boardWidth || ny < 0 || ny >= boardHeight) continue;
  //   if (board[ny][nx]) continue;
  //   const neighborKey = `${nx},${ny}`;
  //   if (blocked.has(neighborKey)) continue;
  //   const regionSize = measureRegionSize(board, { x: nx, y: ny }, blocked, minPathLength);
  //   if (regionSize > 0 && regionSize < minPathLength) {
  //     return true;
  //   }
  // }

  return false;
}

export function getEmptyRegions(board: Board): Point[][] {
  const emptyCells: Point[] = [];
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[0].length; x++) {
      if (!board[y][x]) {
        emptyCells.push({ x, y });
      }
    }
  }

  const regions: Point[][] = [];
  const visited = new Set<string>();

  for (const cell of emptyCells) {
    const key = `${cell.x},${cell.y}`;
    if (!visited.has(key)) {
      const region: Point[] = [];
      const queue: Point[] = [cell];

      while (queue.length > 0) {
        const current = queue.shift()!;
        const currentKey = `${current.x},${current.y}`;

        if (!visited.has(currentKey)) {
          visited.add(currentKey);
          region.push(current);

          const neighbors = getValidNeighbors(board, current, visited, false);
          for (const neighbor of neighbors) {
            if (!visited.has(`${neighbor.x},${neighbor.y}`)) {
              queue.push(neighbor);
            }
          }
        }
      }
      regions.push(region);
    }
  }
  return regions;
}

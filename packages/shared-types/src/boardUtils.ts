import { Board, Point } from "./types";

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
  const directions = [
    { dx: 0, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
  ];
  const boardHeight = board.length;
  const boardWidth = board.length > 0 ? board[0].length : 0;
  return directions
    .map(({ dx, dy }) => ({
      x: point.x + dx,
      y: point.y + dy,
    }))
    .filter(
      ({ x, y }) =>
        x >= 0 &&
        x < boardWidth &&
        y >= 0 &&
        y < boardHeight &&
        (!board[y][x] || (includeEndpoint && board[y][x]?.isEndpoint)) &&
        !visited.has(`${x},${y}`)
    );
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

  function findPathsRecursive(
    currentPoint: Point,
    currentPath: Point[],
    visited: Set<string>
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
      if (isValidPath(board, [...currentPath, neighbor])) {
        if (
          wouldBlockOtherPaths(
            board,
            [...currentPath, neighbor],
            endpointPairs,
            endpointIndex
          )
        ) {
          continue;
        }

        const newVisited = new Set(visited);
        newVisited.add(`${neighbor.x},${neighbor.y}`);

        currentPath.push(neighbor);
        findPathsRecursive(neighbor, currentPath, newVisited);
        currentPath.pop();
      }
    }
  }

  const initialVisited = new Set([`${start.x},${start.y}`]);
  findPathsRecursive(start, [start], initialVisited);

  return paths;
}

function wouldBlockOtherPaths(
  board: Board,
  proposedPath: Point[],
  endpointPairs: Array<[Point, Point, number]>,
  currentPairIndex: number
): boolean {
  const tempBoard = board.map((row) => row.map((cell) => cell));

  for (const point of proposedPath) {
    tempBoard[point.y][point.x] = { pathIndex: -1, isEndpoint: false };
  }

  for (let i = 0; i < endpointPairs.length; i++) {
    if (i === currentPairIndex) continue;

    const [start, end] = endpointPairs[i];

    if (!findPathToPoint(tempBoard, start, end)) {
      return true;
    }
  }

  return false;
}

function findPathToPoint(
  board: Board,
  start: Point,
  target: Point,
  visited = new Set<string>()
): boolean {
  const queue = [{ point: start, path: [start] }];

  while (queue.length > 0) {
    const { point, path } = queue.shift()!;

    if (path.length > 1 && point.x === target.x && point.y === target.y) {
      return true;
    }

    const pointKey = `${point.x},${point.y}`;
    if (visited.has(pointKey)) continue;
    visited.add(pointKey);

    const neighbors = getValidNeighbors(board, point, visited, true);

    for (const neighbor of neighbors) {
      const neighborKey = `${neighbor.x},${neighbor.y}`;
      if (!visited.has(neighborKey)) {
        queue.push({ point: neighbor, path: [...path, neighbor] });
      }
    }
  }

  return false;
}

export function countAdjacent(path: Point[], point: Point): number {
  const directions = [
    { x: -1, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: -1 },
    { x: 0, y: 1 },
  ];
  let adjacentCount = 0;

  for (const dir of directions) {
    const checkX = point.x + dir.x;
    const checkY = point.y + dir.y;

    if (path.some((p) => p.x === checkX && p.y === checkY)) {
      adjacentCount++;
    }
  }

  return adjacentCount;
}

export function isValidPath(board: Board, path: Point[]): boolean {
  for (let i = 0; i < path.length; i++) {
    const point = path[i];
    const isEndpoint = board[point.y][point.x]?.isEndpoint;

    const adjacentCount = countAdjacent(path, point);

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

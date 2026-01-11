/**
 * Benchmark for board generation and validation
 * Run with: pnpm benchmark
 */

import { BoardGenerator } from "../boardGeneration/boardGeneration";
import { pathsHaveBetterSolution } from "../boardGeneration/boardValidatorUtils";
import { Board } from "../types";

// Test configurations
const TEST_SIZES = [
  { width: 5, height: 5 },
  { width: 7, height: 7 },
  { width: 10, height: 10 },
  { width: 12, height: 12 },
  { width: 14, height: 14 },
  { width: 15, height: 15 },
];

const RUNS_PER_SIZE = 3;

interface BenchmarkResult {
  size: string;
  avgTimeMs: number;
  minTimeMs: number;
  maxTimeMs: number;
  successRate: number;
}

async function benchmarkGeneration(): Promise<void> {
  console.log("=== BOARD GENERATION BENCHMARK ===\n");

  const results: BenchmarkResult[] = [];

  for (const { width, height } of TEST_SIZES) {
    const times: number[] = [];
    let successes = 0;

    console.log(`Testing ${width}x${height}...`);

    for (let run = 0; run < RUNS_PER_SIZE; run++) {
      const generator = new BoardGenerator(null);
      const start = performance.now();

      try {
        await generator.generateBoard(width, height);
        const elapsed = performance.now() - start;
        times.push(elapsed);
        successes++;
        console.log(`  Run ${run + 1}: ${elapsed.toFixed(0)}ms`);
      } catch (e) {
        console.log(`  Run ${run + 1}: FAILED`);
      }
    }

    if (times.length > 0) {
      results.push({
        size: `${width}x${height}`,
        avgTimeMs: times.reduce((a, b) => a + b, 0) / times.length,
        minTimeMs: Math.min(...times),
        maxTimeMs: Math.max(...times),
        successRate: successes / RUNS_PER_SIZE,
      });
    }
    console.log("");
  }

  // Summary table
  console.log("\n=== SUMMARY ===\n");
  console.log("Size\t\tAvg\t\tMin\t\tMax\t\tSuccess");
  console.log("----\t\t---\t\t---\t\t---\t\t-------");
  for (const r of results) {
    console.log(
      `${r.size}\t\t${r.avgTimeMs.toFixed(0)}ms\t\t${r.minTimeMs.toFixed(0)}ms\t\t${r.maxTimeMs.toFixed(0)}ms\t\t${(r.successRate * 100).toFixed(0)}%`
    );
  }
}

// Create a filled board for validator testing
function createFilledTestBoard(width: number, height: number): { board: Board; numPaths: number } {
  // Create a simple snaking pattern to fill the board
  const board: Board = Array(height)
    .fill(null)
    .map(() => Array(width).fill(null));

  let pathIndex = 0;
  let x = 0;
  let y = 0;
  let pathLength = 0;
  const targetPathLength = Math.floor((width * height) / Math.max(width, height));

  while (y < height) {
    // Mark start
    if (pathLength === 0) {
      board[y][x] = { pathIndex, isEndpoint: true };
      pathLength++;
    }

    // Move right or left depending on row
    const goRight = y % 2 === 0;
    const nextX = goRight ? x + 1 : x - 1;

    if (nextX >= 0 && nextX < width) {
      x = nextX;
      pathLength++;

      if (pathLength >= targetPathLength || (goRight ? x === width - 1 : x === 0)) {
        // End this path
        board[y][x] = { pathIndex, isEndpoint: true };
        pathIndex++;
        pathLength = 0;

        // Move to next position
        if (goRight && x < width - 1) {
          x++;
        } else if (!goRight && x > 0) {
          x--;
        } else {
          y++;
          if (y < height) {
            board[y][x] = { pathIndex, isEndpoint: true };
            pathLength = 1;
          }
        }
      } else {
        board[y][x] = { pathIndex, isEndpoint: false };
      }
    } else {
      // Move down
      y++;
      if (y < height) {
        if (pathLength > 0) {
          board[y][x] = { pathIndex, isEndpoint: false };
          pathLength++;
        }
      }
    }
  }

  return { board, numPaths: pathIndex };
}

async function benchmarkValidator(): Promise<void> {
  console.log("\n=== VALIDATOR BENCHMARK ===\n");

  for (const { width, height } of TEST_SIZES) {
    console.log(`\nTesting validator on ${width}x${height}...`);

    // First generate a real board
    const generator = new BoardGenerator(null);
    let board: Board;
    let numPaths: number;

    try {
      const start = performance.now();
      board = await generator.generateBoard(width, height);
      const genTime = performance.now() - start;

      // Count paths
      const pathIndices = new Set<number>();
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (board[y][x]) {
            pathIndices.add(board[y][x]!.pathIndex);
          }
        }
      }
      numPaths = pathIndices.size;

      console.log(`  Generated board in ${genTime.toFixed(0)}ms with ${numPaths} paths`);

      // Now test validator directly on this board multiple times
      const validatorTimes: number[] = [];
      for (let i = 0; i < 3; i++) {
        const vStart = performance.now();
        const result = await pathsHaveBetterSolution(board, numPaths);
        const vTime = performance.now() - vStart;
        validatorTimes.push(vTime);
        console.log(`  Validator run ${i + 1}: ${vTime.toFixed(0)}ms (result: ${result})`);
      }

      const avgValidatorTime = validatorTimes.reduce((a, b) => a + b, 0) / validatorTimes.length;
      console.log(`  Validator avg: ${avgValidatorTime.toFixed(0)}ms`);
    } catch (e) {
      console.log(`  FAILED to generate board: ${e}`);
    }
  }
}

async function benchmarkValidatorOnly(): Promise<void> {
  console.log("\n=== VALIDATOR-ONLY BENCHMARK (isolated) ===\n");

  // Test with synthetic boards to isolate validator performance
  for (const { width, height } of TEST_SIZES) {
    const { board, numPaths } = createFilledTestBoard(width, height);

    console.log(`Testing ${width}x${height} with ${numPaths} synthetic paths...`);

    const times: number[] = [];
    for (let i = 0; i < 3; i++) {
      const start = performance.now();
      const result = await pathsHaveBetterSolution(board, numPaths);
      const elapsed = performance.now() - start;
      times.push(elapsed);
      console.log(`  Run ${i + 1}: ${elapsed.toFixed(0)}ms (result: ${result})`);
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    console.log(`  Average: ${avg.toFixed(0)}ms\n`);
  }
}

// Main
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--validator-only")) {
    await benchmarkValidatorOnly();
  } else if (args.includes("--validator")) {
    await benchmarkValidator();
  } else {
    await benchmarkGeneration();
  }
}

main().catch(console.error);

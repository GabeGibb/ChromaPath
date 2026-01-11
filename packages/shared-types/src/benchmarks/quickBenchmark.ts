/**
 * Quick benchmark for testing changes
 * Run with: pnpm quick-bench
 */

import { BoardGenerator } from "../boardGeneration/boardGeneration";

async function main() {
  console.log("=== BOARD GENERATOR BENCHMARK ===\n");

  const gen = new BoardGenerator();
  const sizes = [
    { width: 5, height: 5, runs: 5 },
    { width: 7, height: 7, runs: 5 },
    { width: 10, height: 10, runs: 5 },
    { width: 12, height: 12, runs: 3 },
    { width: 15, height: 15, runs: 3 },
  ];

  for (const { width, height, runs } of sizes) {
    console.log(`--- ${width}x${height} (${runs} runs) ---`);
    const times: number[] = [];
    for (let i = 0; i < runs; i++) {
      const start = performance.now();
      await gen.generateBoard(width, height);
      const elapsed = performance.now() - start;
      times.push(elapsed);
    }
    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    const min = Math.min(...times);
    const max = Math.max(...times);
    console.log(`  AVG: ${avg}ms | MIN: ${Math.round(min)}ms | MAX: ${Math.round(max)}ms\n`);
  }
}

main().catch(console.error);

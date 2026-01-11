import { BoardGenerator } from "../boardGeneration/boardGeneration";

async function main() {
  const gen = new BoardGenerator();
  const times: number[] = [];
  const runs = 20;

  console.log(`=== 10x10 BASELINE (${runs} runs) ===\n`);
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    await gen.generateBoard(10, 10);
    const elapsed = performance.now() - start;
    times.push(elapsed);
    process.stdout.write(`Run ${i + 1}: ${Math.round(elapsed)}ms\n`);
  }

  const sorted = [...times].sort((a, b) => a - b);
  const median = Math.round(sorted[Math.floor(runs / 2)]);
  const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  const min = Math.round(Math.min(...times));
  const max = Math.round(Math.max(...times));
  console.log(`\nMEDIAN: ${median}ms | AVG: ${avg}ms | MIN: ${min}ms | MAX: ${max}ms`);
}

main();

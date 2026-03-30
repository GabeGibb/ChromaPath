/**
 * Board Generation Script
 *
 * Generates pre-computed boards for all supported sizes:
 * - NxN for N = 5 to 15 (square boards)
 * - 15xM for M = 16 to 20 (tall rectangular boards)
 *
 * Usage:
 *   pnpm generate [boardsPerSize] [numWorkers]
 *
 * Example:
 *   pnpm generate 100 4
 *
 * For maximum parallelism, run multiple terminals with generate:size
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Board sizes configuration
const BOARD_SIZES: Array<{ width: number; height: number }> = [
  // Square boards (NxN for N = 5 to 15)
  { width: 5, height: 5 },
  { width: 6, height: 6 },
  { width: 7, height: 7 },
  { width: 8, height: 8 },
  { width: 9, height: 9 },
  { width: 10, height: 10 },
  { width: 11, height: 11 },
  { width: 12, height: 12 },
  { width: 13, height: 13 },
  { width: 14, height: 14 },
  { width: 15, height: 15 },
  // Rectangular boards (15xM for M = 16 to 20)
  { width: 15, height: 16 },
  { width: 15, height: 17 },
  { width: 15, height: 18 },
  { width: 15, height: 19 },
  { width: 15, height: 20 },
];

interface GenerationTask {
  width: number;
  height: number;
  count: number;
}

const boardsPerSize = parseInt(process.argv[2]) || 50;
const numWorkers = parseInt(process.argv[3]) || 4;

console.log(`\n========================================`);
console.log(`ChromaPath Board Generator`);
console.log(`========================================`);
console.log(`Boards per size: ${boardsPerSize}`);
console.log(`Concurrent workers: ${numWorkers}`);
console.log(`Total sizes: ${BOARD_SIZES.length}`);
console.log(`Total boards to generate: ${boardsPerSize * BOARD_SIZES.length}`);
console.log(`========================================\n`);

const outputDir = path.join(process.cwd(), 'generated-boards');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Create task queue
const tasks: GenerationTask[] = BOARD_SIZES.map(size => ({
  width: size.width,
  height: size.height,
  count: boardsPerSize,
}));

let completedTasks = 0;
const totalTasks = tasks.length;
const startTime = Date.now();

function runTask(task: GenerationTask): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = ['tsx', 'scripts/generateSingleSize.ts', String(task.width), String(task.height), String(task.count)];
    const child = spawn('npx', args, {
      cwd: process.cwd(),
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true,
    });

    let output = '';

    child.stdout?.on('data', (data) => {
      output += data.toString();
    });

    child.stderr?.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', (code) => {
      completedTasks++;
      const progress = ((completedTasks / totalTasks) * 100).toFixed(0);
      const sizeKey = `${task.width}x${task.height}`;

      if (code === 0) {
        console.log(`[${progress}%] ${sizeKey}: Done`);
        resolve();
      } else {
        console.log(`[${progress}%] ${sizeKey}: Failed (code ${code})`);
        console.log(output);
        reject(new Error(`Task ${sizeKey} failed`));
      }
    });
  });
}

async function processWithWorkerPool(): Promise<void> {
  const taskQueue = [...tasks];
  const running: Promise<void>[] = [];

  while (taskQueue.length > 0 || running.length > 0) {
    // Fill up to numWorkers concurrent tasks
    while (running.length < numWorkers && taskQueue.length > 0) {
      const task = taskQueue.shift()!;
      const promise = runTask(task).finally(() => {
        const idx = running.indexOf(promise);
        if (idx >= 0) running.splice(idx, 1);
      });
      running.push(promise);
    }

    // Wait for at least one to complete
    if (running.length > 0) {
      await Promise.race(running);
    }
  }
}

processWithWorkerPool()
  .then(() => {
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n========================================`);
    console.log(`Generation complete!`);
    console.log(`Total time: ${totalTime}s`);
    console.log(`Output: ${outputDir}`);
    console.log(`\nRun 'pnpm copy-boards' to copy to mobile app`);
    console.log(`========================================\n`);
  })
  .catch((err) => {
    console.error('Generation failed:', err);
    process.exit(1);
  });

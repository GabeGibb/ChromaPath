/**
 * Single Size Board Generator
 *
 * Run this in multiple terminals for maximum parallelism.
 * Each instance generates boards for a single size.
 *
 * Usage:
 *   pnpm tsx scripts/generateSingleSize.ts <width> <height> <count>
 *
 * Example:
 *   # Terminal 1:
 *   pnpm tsx scripts/generateSingleSize.ts 5 5 100
 *
 *   # Terminal 2:
 *   pnpm tsx scripts/generateSingleSize.ts 10 10 100
 *
 *   # Terminal 3:
 *   pnpm tsx scripts/generateSingleSize.ts 15 15 100
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

// Dynamic import from the package source (Windows needs file:// URLs)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sharedTypesPath = path.join(__dirname, '..', 'packages', 'shared-types', 'src', 'boardGeneration', 'boardGeneration.ts');
const { BoardGenerator } = await import(pathToFileURL(sharedTypesPath).href);

const width = parseInt(process.argv[2]);
const height = parseInt(process.argv[3]);
const count = parseInt(process.argv[4]) || 100;

if (!width || !height) {
  console.log('Usage: pnpm tsx scripts/generateSingleSize.ts <width> <height> <count>');
  console.log('');
  console.log('Available sizes:');
  console.log('  Square (NxN): 5-15');
  console.log('  Rectangular (15xM): 15x16, 15x17, 15x18, 15x19, 15x20');
  process.exit(1);
}

const sizeKey = `${width}x${height}`;
console.log(`\nGenerating ${count} boards for ${sizeKey}...\n`);

const outputDir = path.join(process.cwd(), 'generated-boards');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const generator = new BoardGenerator();
const boards: any[] = [];
const startTime = Date.now();

// Check for existing file and append if present
const filename = `boards-${sizeKey}.json`;
const filepath = path.join(outputDir, filename);
let existingBoards: any[] = [];

if (fs.existsSync(filepath)) {
  try {
    existingBoards = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    console.log(`Found ${existingBoards.length} existing boards, will append new ones\n`);
  } catch {
    console.log(`Existing file corrupted, starting fresh\n`);
  }
}

for (let i = 0; i < count; i++) {
  const boardStart = Date.now();
  try {
    const board = generator.generateBoard(width, height);
    boards.push(board);
    const boardTime = ((Date.now() - boardStart) / 1000).toFixed(2);
    const progress = (((i + 1) / count) * 100).toFixed(0);
    process.stdout.write(`\r[${progress}%] Generated ${i + 1}/${count} boards (last: ${boardTime}s)`);
  } catch (error) {
    console.error(`\nFailed to generate board ${i + 1}:`, error);
  }
}

const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`\n\nGenerated ${boards.length} new boards in ${totalTime}s`);

// Combine with existing and write
const allBoards = [...existingBoards, ...boards];
fs.writeFileSync(filepath, JSON.stringify(allBoards, null, 0));
console.log(`Total boards in ${filename}: ${allBoards.length}`);

// Update manifest
const manifestPath = path.join(outputDir, 'manifest.json');
let manifest: Record<string, { count: number; file: string }> = {};
if (fs.existsSync(manifestPath)) {
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  } catch { }
}
manifest[sizeKey] = { count: allBoards.length, file: filename };
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log(`Done! Output: ${filepath}\n`);

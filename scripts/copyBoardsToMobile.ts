/**
 * Copy Generated Boards to Mobile Assets
 *
 * Copies boards from generated-boards/ to apps/mobile/assets/boards/
 *
 * Usage:
 *   pnpm tsx scripts/copyBoardsToMobile.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const sourceDir = path.join(process.cwd(), 'generated-boards');
const destDir = path.join(process.cwd(), 'apps', 'mobile', 'assets', 'boards');

// Ensure destination exists
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Check if source exists
if (!fs.existsSync(sourceDir)) {
  console.error('Error: generated-boards/ directory not found.');
  console.error('Run "pnpm generate" first to generate boards.');
  process.exit(1);
}

// Get all JSON files
const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.json'));

if (files.length === 0) {
  console.error('Error: No JSON files found in generated-boards/');
  console.error('Run "pnpm generate" first to generate boards.');
  process.exit(1);
}

console.log(`\nCopying ${files.length} files to mobile assets...\n`);

let totalBoards = 0;

for (const file of files) {
  const src = path.join(sourceDir, file);
  const dest = path.join(destDir, file);

  fs.copyFileSync(src, dest);

  // Count boards if it's a board file (not manifest)
  if (file.startsWith('boards-')) {
    try {
      const boards = JSON.parse(fs.readFileSync(src, 'utf-8'));
      totalBoards += boards.length;
      console.log(`  ${file}: ${boards.length} boards`);
    } catch {
      console.log(`  ${file}: copied`);
    }
  } else {
    console.log(`  ${file}: copied`);
  }
}

console.log(`\nDone! Copied ${files.length} files with ${totalBoards} total boards.`);
console.log(`Destination: ${destDir}\n`);

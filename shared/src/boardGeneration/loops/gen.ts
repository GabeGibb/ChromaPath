import { Board } from "../../types";
import { pathsHaveBetterSolution } from "../randomPaths/boardValidatorUtils";
import { Grid, UnionFind } from "./grid";
import { Mitm } from "./mitm";

// Constants
const LOOP_TRIES = 1000;

interface PuzzleOptions {
	width: number;
	height: number;
	minNumbers?: number;
	maxNumbers?: number;
}

function hasLoops(grid: Grid, uf: UnionFind): boolean {
	// Check whether the puzzle has loops not attached to an endpoint
	const groups = new Set();
	for (let y = 0; y < grid.h; y++) {
		for (let x = 0; x < grid.w; x++) {
			groups.add(uf.find(`${x},${y}`));
		}
	}

	let ends = 0;
	for (let y = 0; y < grid.h; y++) {
		for (let x = 0; x < grid.w; x++) {
			const cell = grid.getItem([x, y]);
			if ("v^<>".includes(cell)) {
				ends++;
			}
		}
	}

	return ends !== 2 * groups.size;
}

function hasPair(tg: Grid, uf: UnionFind): boolean {
	// Check for a pair of endpoints next to each other
	for (let y = 0; y < tg.h; y++) {
		for (let x = 0; x < tg.w; x++) {
			for (const [dx, dy] of [
				[1, 0],
				[0, 1],
			]) {
				const x1 = x + dx;
				const y1 = y + dy;
				if (x1 < tg.w && y1 < tg.h) {
					if (
						tg.getItem([x, y]) === "x" &&
						tg.getItem([x1, y1]) === "x" &&
						uf.find(`${x},${y}`) === uf.find(`${x1},${y1}`)
					) {
						return true;
					}
				}
			}
		}
	}
	return false;
}

function hasTriple(tg: Grid, uf: UnionFind): boolean {
	// Check whether a path has a point with three same-colored neighbours
	for (let y = 0; y < tg.h; y++) {
		for (let x = 0; x < tg.w; x++) {
			const r = uf.find(`${x},${y}`);
			let nbs = 0;
			for (const [dx, dy] of [
				[1, 0],
				[0, 1],
				[-1, 0],
				[0, -1],
			]) {
				const x1 = x + dx;
				const y1 = y + dy;
				if (0 <= x1 && x1 < tg.w && 0 <= y1 && y1 < tg.h) {
					if (uf.find(`${x1},${y1}`) === r) {
						nbs++;
					}
				}
			}
			if (nbs >= 3) {
				return true;
			}
		}
	}
	return false;
}

function make(w: number, h: number, mitm: Mitm, minNumbers: number = 0, maxNumbers: number = 1000): Grid {
	function testReady(grid: Grid): boolean {
		const sg = grid.shrink();
		const [stg, uf] = sg.makeTubes();
		const numbers = Array.from(stg.grid.values()).filter((x) => x === "x").length / 2;

		return minNumbers <= numbers && numbers <= maxNumbers && !hasLoops(sg, uf) && !hasPair(stg, uf) && !hasTriple(stg, uf);
	}
	// Internally we work on a double size grid to handle crossings
	const grid = new Grid(2 * w + 1, 2 * h + 1);

	while (true) {
		// Previous tries may have drawn stuff on the grid
		grid.grid.clear();

		// Add left side path
		const path = mitm.randPath(h, h, 0, -1);
		if (!grid.testPath(path, 0, 0)) {
			continue;
		}
		grid.drawPath(path, 0, 0);
		// Draw_path doesn't know what to put in the first and last squares
		grid.setItem([0, 0], "\\");
		grid.setItem([0, 2 * h], "/");

		// Add right side path
		const path2 = mitm.randPath(h, h, 0, -1);
		if (!grid.testPath(path2, 2 * w, 2 * h, 0, -1)) {
			continue;
		}
		grid.drawPath(path2, 2 * w, 2 * h, 0, -1);
		grid.setItem([2 * w, 0], "/");
		grid.setItem([2 * w, 2 * h], "\\");

		// The puzzle might already be ready to return
		if (testReady(grid)) {
			return grid.shrink();
		}

		// Add loops in the middle
		let [tg] = grid.makeTubes();

		// Maximum number of tries before retrying main loop
		for (let i = 0; i < LOOP_TRIES; i++) {
			const x = 2 * Math.floor(Math.random() * w);
			const y = 2 * Math.floor(Math.random() * h);

			// If the square doesn't have an orientation, it's a corner
			// or endpoint, so there's no point trying to add a loop there
			if (!["-", "|"].includes(tg.getItem([x, y]))) {
				continue;
			}

			const path = mitm.randLoop(tg.getItem([x, y]) === "-" ? 1 : -1);
			if (grid.testPath(path, x, y)) {
				// Clear the insides to avoid orientation issues
				grid.clearPath(path, x, y);

				// Add path and recompute orientations
				grid.drawPath(path, x, y, 0, 1, true);
				[tg] = grid.makeTubes();

				// Run tests to see if the puzzle is nice
				const sg = grid.shrink();
				const [stg] = sg.makeTubes();
				const numbers = Array.from(stg.grid.values()).filter((x) => x === "x").length / 2;

				if (numbers > maxNumbers) {
					break;
				}
				if (testReady(grid)) {
					return sg;
				}
			}
		}
	}
}

function generatePuzzle(options: PuzzleOptions): Board {
	const { width, height, minNumbers, maxNumbers } = options;

	if (width < 4 || height < 4) {
		throw new Error("Please choose width and height at least 4.");
	}

	const actualMinNumbers = minNumbers ?? width;
	const actualMaxNumbers = maxNumbers ?? 1000;

	for (let i = 0; i < 5; i++) {
		const mitm = new Mitm(2, 1);
		// Using a larger path length in mitm might increase puzzle complexity, but
		// 8 or 10 appears to be the sweet spot if we want small sizes like 4x4 to work
		mitm.prepare(Math.min(20, Math.max(height, 6)));

		const grid = make(width, height, mitm, actualMinNumbers, actualMaxNumbers);

		// Convert the grid to a board
		const [tg, uf] = grid.makeTubes();
		const board: Board = Array.from({ length: height }, () => Array(width).fill(null));
		const pathGroups = new Map<string, Array<[number, number]>>();

		// First pass: collect all cells in each path group, regardless of cell value
		for (let y = 0; y < tg.h; y++) {
			for (let x = 0; x < tg.w; x++) {
				const cell = tg.getItem([x, y]);
				if (cell) {
					// Include all non-null cells
					const group = uf.find(`${x},${y}`);
					if (!pathGroups.has(group)) {
						pathGroups.set(group, []);
					}
					pathGroups.get(group)!.push([x, y]);
				}
			}
		}

		// Now assign path indices and populate the board
		let pathIndex = 0;
		for (const [_, cells] of pathGroups) {
			// Add all cells from this path to the board
			for (const [x, y] of cells) {
				const cell = tg.getItem([x, y]);
				board[y][x] = {
					pathIndex,
					isEndpoint: cell === "x", // Only mark as endpoint if cell value is "x"
				};
			}

			pathIndex++;
		}
		console.log("starting validation");
		if (pathsHaveBetterSolution(board, pathIndex)) {
			// console.log("WHAT");
			// return board;
			continue;
		}
		return board;
	}
	throw new Error("Failed to generate a puzzle after 1000 tries");
}

export { generatePuzzle, type PuzzleOptions };

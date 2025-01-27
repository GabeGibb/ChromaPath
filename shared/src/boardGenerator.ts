import { Grid, GridContent, UnionFind } from "./grid";
import { Mitm } from "./mitm";
const LOOP_TRIES = 1000;

interface PuzzleConfig {
	width: number;
	height: number;
	minNumbers?: number;
	maxNumbers?: number;
}

interface PuzzleResult {
	grid: Grid;
	tubeGrid: Grid;
	unionFind: UnionFind;
	numberCount: number;
}

function hasLoops(grid: Grid, uf: UnionFind): boolean {
	const groups = new Set();
	for (let y = 0; y < grid.h; y++) {
		for (let x = 0; x < grid.w; x++) {
			groups.add(uf.find([x, y]));
		}
	}

	let ends = 0;
	for (let y = 0; y < grid.h; y++) {
		for (let x = 0; x < grid.w; x++) {
			if ("v^<>".includes(grid.get([x, y]))) {
				ends++;
			}
		}
	}

	return ends !== 2 * groups.size;
}

function hasPair(tg: Grid, uf: UnionFind): boolean {
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
						tg.get([x, y]) === "x" &&
						tg.get([x1, y1]) === "x" &&
						uf.find([x, y]).toString() === uf.find([x1, y1]).toString()
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
	for (let y = 0; y < tg.h; y++) {
		for (let x = 0; x < tg.w; x++) {
			const r = uf.find([x, y]);
			let neighbors = 0;
			for (const [dx, dy] of [
				[1, 0],
				[0, 1],
				[-1, 0],
				[0, -1],
			]) {
				const x1 = x + dx;
				const y1 = y + dy;
				if (x1 >= 0 && x1 < tg.w && y1 >= 0 && y1 < tg.h) {
					if (uf.find([x1, y1]).toString() === r.toString()) {
						neighbors++;
					}
				}
			}
			if (neighbors >= 3) {
				return true;
			}
		}
	}
	return false;
}

function make(w: number, h: number, mitm: Mitm, minNumbers: number, maxNumbers: number) {
	const width = w;
	const height = h;

	if (width < 4 || height < 4) {
		throw new Error("Width and height must be at least 4");
	}

	function testReady(grid: Grid): boolean {
		const sg = grid.shrink();
		const [stg, uf] = sg.makeTubes();
		const numbers = Array.from(stg.values()).filter((v) => v === "x").length / 2;
		return minNumbers <= numbers && numbers <= maxNumbers && !hasLoops(sg, uf) && !hasPair(stg, uf) && !hasTriple(stg, uf);
	}

	// Initialize MITM table
	const grid: Grid = new Grid(2 * width + 1, 2 * height + 1);

	while (true) {
		grid.clear();

		// Add left side path
		const path = mitm.randPath(height, height, 0, -1);
		if (!path || !grid.testPath(path, 0, 0)) {
			continue;
		}
		grid.drawPath(path, 0, 0);
		grid.set([0, 0], "\\");
		grid.set([0, 2 * height], "/");

		// Add right side path
		const path2 = mitm.randPath(height, height, 0, -1);
		if (!path2 || !grid.testPath(path2, 2 * width, 2 * height, 0, -1)) {
			continue;
		}
		grid.drawPath(path2, 2 * width, 2 * height, 0, -1);
		grid.set([2 * width, 0], "/");
		grid.set([2 * width, 2 * height], "\\");

		// Check if puzzle is ready
		if (testReady(grid)) {
			return grid.shrink();
		}

		// Add loops in the middle
		const [tg] = grid.makeTubes();

		for (let tries = 0; tries < LOOP_TRIES; tries++) {
			const x = 2 * Math.floor(Math.random() * width);
			const y = 2 * Math.floor(Math.random() * height);

			// TODO: SUSPECT
			if (!"-|".includes(tg.get([x, y])) || !tg.get([x, y])) {
				continue;
			}

			const path = mitm.randLoop(tg.get([x, y]) === "-" ? 1 : -1);
			if (path && grid.testPath(path, x, y)) {
				grid.clearPath(path, x, y);
				grid.drawPath(path, x, y, 0, 1, true);

				const [tg] = grid.makeTubes();

				const sg = grid.shrink();
				const stg: Grid = sg.makeTubes()[0];
				const numbers = Array.from(stg.values()).filter((v) => v === "x").length / 2;
				if (numbers > maxNumbers) {
					console.log("exceeded the max number of pairs");
					break;
				}
				if (testReady(grid)) {
					console.log("finished in tries", tries);
					return sg;
				}
			}
		}
	}
}

function generateNumberLink(config: PuzzleConfig): GridContent | null {
	const { width, height, minNumbers = 0, maxNumbers = 1000 } = config;

	if (width < 4 || height < 4) {
		throw new Error("Width and height must be at least 4");
	}

	// Initialize MITM table
	const mitm = new Mitm(2, 1); // lr_price=2, t_price=1
	mitm.prepare(Math.min(20, Math.max(height, 6)));

	const grid: Grid = make(width, height, mitm, 5, 5); // TODO: MAX AND MIN

	const [tubeGrid, uf] = grid.makeTubes();
	console.log("tubeGrid", tubeGrid);
	return tubeGrid.grid;
}

export { generateNumberLink, type PuzzleConfig, type PuzzleResult };

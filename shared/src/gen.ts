import { Grid, UnionFind } from "./grid";
import { Mitm } from "./mitm";

// Constants
const LOOP_TRIES = 1000;

interface GeneratorOptions {
	width: number;
	height: number;
	minNumbers?: number;
	maxNumbers?: number;
	verbose?: boolean;
}

function hasLoops(grid: Grid, uf: UnionFind): boolean {
	const groups = new Set<string>();
	for (let y = 0; y < grid.h; y++) {
		for (let x = 0; x < grid.w; x++) {
			const found = uf.find([x, y]);
			groups.add(`${found[0]},${found[1]}`);
		}
	}

	let ends = 0;
	for (let y = 0; y < grid.h; y++) {
		for (let x = 0; x < grid.w; x++) {
			const value = grid.get([x, y]);
			if ("v^<>".includes(value)) {
				ends++;
			}
		}
	}

	return ends !== 2 * groups.size;
}

function hasPair(tubeGrid: Grid, uf: UnionFind): boolean {
	for (let y = 0; y < tubeGrid.h; y++) {
		for (let x = 0; x < tubeGrid.w; x++) {
			for (const [dx, dy] of [
				[1, 0],
				[0, 1],
			]) {
				const x1 = x + dx;
				const y1 = y + dy;
				if (x1 < tubeGrid.w && y1 < tubeGrid.h) {
					const value = tubeGrid.get([x, y]);
					const nextValue = tubeGrid.get([x1, y1]);
					if (value === "x" && nextValue === "x") {
						const pos1Found = uf.find([x, y]);
						const pos2Found = uf.find([x1, y1]);
						if (pos1Found[0] === pos2Found[0] && pos1Found[1] === pos2Found[1]) {
							return true;
						}
					}
				}
			}
		}
	}
	return false;
}

function hasTriple(tubeGrid: Grid, uf: UnionFind): boolean {
	const directions: [number, number][] = [
		[1, 0],
		[0, 1],
		[-1, 0],
		[0, -1],
	];

	for (let y = 0; y < tubeGrid.h; y++) {
		for (let x = 0; x < tubeGrid.w; x++) {
			const current = uf.find([x, y]);
			let neighbors = 0;

			for (const [dx, dy] of directions) {
				const x1 = x + dx;
				const y1 = y + dy;
				if (x1 >= 0 && x1 < tubeGrid.w && y1 >= 0 && y1 < tubeGrid.h) {
					const neighbor = uf.find([x1, y1]);
					if (current[0] === neighbor[0] && current[1] === neighbor[1]) {
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

function make(options: GeneratorOptions): Grid {
	const { width: w, height: h, minNumbers = 0, maxNumbers = 1000 } = options;

	function testReady(grid: Grid): boolean {
		const smallGrid = grid.shrink();
		const [smallTubeGrid, uf] = smallGrid.makeTubes();

		// Count number of endpoints ('x' values) divided by 2 for pairs
		let numbers = 0;
		for (const value of smallTubeGrid.values()) {
			if (value === "x") numbers++;
		}
		numbers = Math.floor(numbers / 2);

		return (
			numbers >= minNumbers &&
			numbers <= maxNumbers &&
			!hasLoops(smallGrid, uf) &&
			!hasPair(smallTubeGrid, uf) &&
			!hasTriple(smallTubeGrid, uf)
		);
	}

	// Initialize MITM helper
	const mitm = new Mitm(2, 1); // lr_price = 2, t_price = 1
	mitm.prepare(Math.min(20, Math.max(h, 6)));

	while (true) {
		// Create a double-size grid to handle crossings
		const grid = new Grid(2 * w + 1, 2 * h + 1);
		grid.clear();

		// Add left side path
		const path = mitm.randPath2(h, h, 0, -1);
		if (!grid.testPath(path, 0, 0)) {
			continue;
		}
		grid.drawPath(path, 0, 0);
		grid.set([0, 0], "\\");
		grid.set([0, 2 * h], "/");

		// Add right side path
		const path2 = mitm.randPath2(h, h, 0, -1);
		if (!grid.testPath(path2, 2 * w, 2 * h, 0, -1)) {
			continue;
		}
		grid.drawPath(path2, 2 * w, 2 * h, 0, -1);
		grid.set([2 * w, 0], "/");
		grid.set([2 * w, 2 * h], "\\");

		// Check if puzzle is already ready
		if (testReady(grid)) {
			return grid.shrink();
		}

		// Add loops in the middle
		let [tubeGrid] = grid.makeTubes();

		// Try adding loops
		for (let tries = 0; tries < LOOP_TRIES; tries++) {
			const x = 2 * Math.floor(Math.random() * w);
			const y = 2 * Math.floor(Math.random() * h);

			const cellValue = tubeGrid.get([x, y]);
			if (cellValue !== "-" && cellValue !== "|") {
				continue;
			}

			const loop = mitm.randLoop(cellValue === "-" ? 1 : -1);
			if (grid.testPath(loop, x, y)) {
				grid.clearPath(loop, x, y);
				grid.drawPath(loop, x, y, 0, 1, true);
				[tubeGrid] = grid.makeTubes();

				const smallGrid = grid.shrink();
				const [smallTubeGrid] = smallGrid.makeTubes();

				let numbers = 0;
				for (const value of smallTubeGrid.values()) {
					if (value === "x") numbers++;
				}
				numbers = Math.floor(numbers / 2);

				if (numbers > maxNumbers) {
					break;
				}

				if (testReady(grid)) {
					return smallGrid;
				}
			}
		}
	}
}

export function generatePuzzle(options: GeneratorOptions): Grid {
	if (options.width < 4 || options.height < 4) {
		throw new Error("Please choose width and height at least 4.");
	}

	const n = Math.floor(Math.sqrt(options.width * options.height));
	const minNumbers = options.minNumbers ?? Math.floor((n * 2) / 3);
	const maxNumbers = options.maxNumbers ?? Math.floor((n * 3) / 2);

	return make({
		...options,
		minNumbers,
		maxNumbers,
	});
}

export { type GeneratorOptions };

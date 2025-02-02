// Types of steps in a path
enum Step {
	T, // Straight
	L, // Left turn
	R, // Right turn
}

// Type for position and direction
type Position = [number, number];
type Direction = [number, number];
type PathEnd = [number, number, number, number];

class Path {
	public steps: Step[];

	constructor(steps: Step[]) {
		this.steps = steps;
	}

	*xys(dx: number = 0, dy: number = 1): Generator<Position> {
		let x = 0,
			y = 0;
		yield [x, y];

		for (const step of this.steps) {
			x += dx;
			y += dy;
			yield [x, y];

			if (step === Step.L) {
				[dx, dy] = [-dy, dx];
			} else if (step === Step.R) {
				[dx, dy] = [dy, -dx];
			} else if (step === Step.T) {
				x += dx;
				y += dy;
				yield [x, y];
			}
		}
	}

	testLoop(): boolean {
		const positions: Position[] = Array.from(this.xys());
		const seen = new Set(positions.map((p) => `${p[0]},${p[1]}`));

		return (
			positions.length === seen.size ||
			(positions.length === seen.size + 1 &&
				positions[0][0] === positions[positions.length - 1][0] &&
				positions[0][1] === positions[positions.length - 1][1])
		);
	}

	winding(): number {
		return this.steps.filter((s) => s === Step.R).length - this.steps.filter((s) => s === Step.L).length;
	}
}

function unrotate(x: number, y: number, dx: number, dy: number): [number, number, number, number] {
	while (dx !== 0 || dy !== 1) {
		[x, y] = [-y, x];
		[dx, dy] = [-dy, dx];
	}
	return [x, y, dx, dy];
}

class Mitm {
	private lrPrice: number;
	private tPrice: number;
	private inv: Map<string, Path[]>;
	private list: [Path, ...number[]][];

	constructor(lrPrice: number, tPrice: number) {
		this.lrPrice = lrPrice;
		this.tPrice = tPrice;
		this.inv = new Map();
		this.list = [];
	}

	prepare(budget: number): void {
		const dx0 = 0,
			dy0 = 1;
		for (const [path, end] of this.goodPaths(0, 0, dx0, dy0, budget)) {
			this.list.push([path, ...end]);
			const key = `${end[0]},${end[1]},${end[2]},${end[3]}`;
			if (!this.inv.has(key)) {
				this.inv.set(key, []);
			}
			this.inv.get(key)!.push(path);
		}
	}

	randPath2(xn: number, yn: number, dxn: number, dyn: number): Path {
		const seen = new Set<string>();
		let path: Step[] = [];

		while (true) {
			seen.clear();
			path = [];
			let x = 0,
				y = 0,
				dx = 0,
				dy = 1;
			seen.add(`${x},${y}`);

			for (let i = 0; i < 2 * (Math.abs(xn) + Math.abs(yn)); i++) {
				// Sample with weights proportional to what they are in goodPaths
				const weights = [1 / this.lrPrice, 1 / this.lrPrice, 2 / this.tPrice];
				const total = weights.reduce((a, b) => a + b, 0);
				let r = Math.random() * total;
				let step: Step;

				if (r < weights[0]) {
					step = Step.L;
				} else if (r < weights[0] + weights[1]) {
					step = Step.R;
				} else {
					step = Step.T;
				}

				path.push(step);
				x += dx;
				y += dy;

				const posKey = `${x},${y}`;
				if (seen.has(posKey)) break;
				seen.add(posKey);

				if (step === Step.L) {
					[dx, dy] = [-dy, dx];
				} else if (step === Step.R) {
					[dx, dy] = [dy, -dx];
				} else if (step === Step.T) {
					x += dx;
					y += dy;
					const newPosKey = `${x},${y}`;
					if (seen.has(newPosKey)) break;
					seen.add(newPosKey);
				}

				if (x === xn && y === yn) {
					return new Path(path);
				}

				const ends = this.lookup(dx, dy, xn - x, yn - y, dxn, dyn);
				if (ends.length > 0) {
					const randomEnd = ends[Math.floor(Math.random() * ends.length)];
					return new Path([...path, ...randomEnd.steps]);
				}
			}
		}
	}

	randLoop(clock: number = 0): Path {
		while (true) {
			const idx = Math.floor(Math.random() * this.list.length);
			const [path, x, y, dx, dy] = this.list[idx];
			const paths2 = this.lookup(dx, dy, -x, -y, 0, 1);

			if (paths2.length > 0) {
				const path2 = paths2[Math.floor(Math.random() * paths2.length)];
				const joined = new Path([...path.steps, ...path2.steps]);

				if (clock && joined.winding() !== clock * 4) {
					continue;
				}

				if (joined.testLoop()) {
					return joined;
				}
			}
		}
	}

	private *goodPaths(
		x: number,
		y: number,
		dx: number,
		dy: number,
		budget: number,
		seen: Set<string> = new Set()
	): Generator<[Path, PathEnd]> {
		if (budget >= 0) {
			yield [new Path([]), [x, y, dx, dy]];
		}
		if (budget <= 0) {
			return;
		}

		const posKey = `${x},${y}`;
		seen.add(posKey);

		const x1 = x + dx,
			y1 = y + dy;
		const pos1Key = `${x1},${y1}`;

		if (!seen.has(pos1Key)) {
			// Try left turn
			for (const [path, end] of this.goodPaths(x1, y1, -dy, dx, budget - this.lrPrice, seen)) {
				yield [new Path([Step.L, ...path.steps]), end];
			}

			// Try right turn
			for (const [path, end] of this.goodPaths(x1, y1, dy, -dx, budget - this.lrPrice, seen)) {
				yield [new Path([Step.R, ...path.steps]), end];
			}

			seen.add(pos1Key);
			const x2 = x1 + dx,
				y2 = y1 + dy;
			const pos2Key = `${x2},${y2}`;

			if (!seen.has(pos2Key)) {
				// Try straight
				for (const [path, end] of this.goodPaths(x2, y2, dx, dy, budget - this.tPrice, seen)) {
					yield [new Path([Step.T, ...path.steps]), end];
				}
			}
			seen.delete(pos1Key);
		}
		seen.delete(posKey);
	}

	private lookup(dx: number, dy: number, xn: number, yn: number, dxn: number, dyn: number): Path[] {
		const [xt, yt, dxt, dyt] = unrotate(xn, yn, dx, dy);
		const key = `${xt},${yt},${dxt},${dyt}`;
		return this.inv.get(key) || [];
	}
}

export { Mitm, Path, Step };

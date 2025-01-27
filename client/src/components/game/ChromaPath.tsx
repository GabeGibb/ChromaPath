import { BoardGenerator, generateNumberLink, PuzzleConfig } from "@chromapath/shared";
import React, { useEffect, useRef, useState } from "react";
import { ChromaPathGame } from "./GameLogic";
import { ChromaPathRenderer } from "./Renderer";

interface Props {
	initialSize?: number;
}

// TODO: rm?
function getDistancedColorArray(): string[] {
	function maximizePairwiseDistance(numColors: number): string[] {
		const colors: number[][] = [];

		// Generate permutations of high and low RGB values
		const levels = [0, 255, 85, 170]; // High, low, and medium values
		for (const r of levels) {
			for (const g of levels) {
				for (const b of levels) {
					if (r === 0 && g === 0 && b === 0) continue; // Skip black
					if (r === 255 && g === 255 && b === 255) continue; // Skip white
					colors.push([r, g, b]);
				}
			}
		}

		// Select `numColors` points, maximizing pairwise distance
		const selectedColors: number[][] = [];
		selectedColors.push(colors[0]); // Start with the first color

		while (selectedColors.length < numColors && colors.length > 0) {
			let maxDistance = 0;
			let nextColor: number[] | null = null;

			for (const color of colors) {
				const minDistanceToSet = Math.min(...selectedColors.map((c) => distance3D(c, color)));

				if (minDistanceToSet > maxDistance) {
					maxDistance = minDistanceToSet;
					nextColor = color;
				}
			}

			if (nextColor) {
				selectedColors.push(nextColor);
				colors.splice(colors.indexOf(nextColor), 1); // Remove selected color
			}
		}

		return selectedColors.map(([r, g, b]) => `rgb(${r}, ${g}, ${b})`);
	}

	function distance3D(a: number[], b: number[]): number {
		return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2) + Math.pow(a[2] - b[2], 2));
	}

	// Generate and assign colors
	const colors = maximizePairwiseDistance(62); // TODO: 62 is hardcoded because 4 x 4 x 4 = 64, but we skip black and white

	return colors;
}

const ChromaPath: React.FC<Props> = ({ initialSize = 5 }) => {
	const canvasRef = useRef<HTMLDivElement>(null);
	const gameRef = useRef<ChromaPathGame | null>(null);
	const rendererRef = useRef<ChromaPathRenderer | null>(null);
	const boardGeneratorRef = useRef<BoardGenerator | null>(null);
	const [boardSize, setBoardSize] = useState(initialSize);
	const [boardGenerating, setBoardGenerating] = useState<boolean>(true);

	const gameActionsNotReady = !gameRef.current || !rendererRef.current || !rendererRef.current.initialized || boardGenerating;

	useEffect(() => {
		if (!canvasRef.current) return;
		async function initializeObjects() {
			rendererRef.current = new ChromaPathRenderer(canvasRef.current!);
			boardGeneratorRef.current = new BoardGenerator();
			gameRef.current = new ChromaPathGame();
			handleNewLevel();
		}
		initializeObjects();

		return () => {
			rendererRef.current?.destroy();
		};
	}, []);

	useEffect(() => {
		if (gameActionsNotReady) return;
		const renderer = rendererRef.current!;
		const game = gameRef.current!;
		const canvas = renderer.getCanvas();

		const handleMouseMove = (event: MouseEvent) => {
			if (gameActionsNotReady) return;

			const rect = canvas.getBoundingClientRect();
			const canvasWidth = rect.width;
			const cellSize = canvasWidth / boardSize;

			const x = Math.floor((event.clientX - rect.left) / cellSize);
			const y = Math.floor((event.clientY - rect.top) / cellSize);

			const clampedX = Math.max(0, Math.min(x, boardSize - 1));
			const clampedY = Math.max(0, Math.min(y, boardSize - 1));

			game.handleMouseMove(clampedX, clampedY);
			const state = game.getState();
			if (state) renderer.render(state, boardSize);
		};

		const handlePointerDown = (event: PointerEvent | Touch) => {
			if (gameActionsNotReady) return;

			const rect = canvas.getBoundingClientRect();
			const canvasWidth = rect.width;
			const cellSize = canvasWidth / boardSize;

			const x = Math.floor((event.clientX - rect.left) / cellSize);
			const y = Math.floor((event.clientY - rect.top) / cellSize);
			const clampedX = Math.max(0, Math.min(x, boardSize - 1));
			const clampedY = Math.max(0, Math.min(y, boardSize - 1));

			game.handleCellClick(clampedX, clampedY);
			const state = game.getState();
			if (state) renderer.render(state, boardSize);
		};

		const handlePointerMove = (event: PointerEvent | Touch) => {
			if (gameActionsNotReady) return;

			const rect = canvas.getBoundingClientRect();
			const canvasWidth = rect.width;
			const cellSize = canvasWidth / boardSize;

			const x = Math.floor((event.clientX - rect.left) / cellSize);
			const y = Math.floor((event.clientY - rect.top) / cellSize);
			const clampedX = Math.max(0, Math.min(x, boardSize - 1));
			const clampedY = Math.max(0, Math.min(y, boardSize - 1));

			game.handleDrag(clampedX, clampedY);
			const state = game.getState();
			if (state) renderer.render(state, boardSize);
		};

		const handleTouchMove = (event: TouchEvent) => {
			const touch = event.touches[0];
			handlePointerMove(touch);
		};

		const handleTouchStart = (event: TouchEvent) => {
			const touch = event.touches[0];
			handlePointerDown(touch);
		};

		const handlePointerUp = () => {
			if (gameActionsNotReady) return;

			const gameComplete = game.endDrag();
			const state = game.getState();
			if (state) renderer.render(state, boardSize);

			if (gameComplete) {
				handleNewLevel();
			}
		};

		const handleWindowResize = () => {
			if (gameActionsNotReady || !canvasRef.current) return;
			renderer.resize(canvasRef.current);
			const state = game.getState();
			if (state) renderer.render(state, boardSize);
		};

		document.addEventListener("pointerdown", handlePointerDown);
		document.addEventListener("pointermove", handlePointerMove);
		document.addEventListener("pointerup", handlePointerUp);
		canvas.addEventListener("mousemove", handleMouseMove);
		canvas.addEventListener("touchstart", handleTouchStart);
		canvas.addEventListener("touchmove", handleTouchMove);
		document.addEventListener("touchend", handlePointerUp);
		addEventListener("resize", handleWindowResize);

		document.addEventListener(
			"touchmove",
			function (event) {
				if (event.touches[0].clientX !== 0) {
					event.preventDefault(); // Prevent horizontal swiping
				}
			},
			{ passive: false } // Required to make `preventDefault` work
		);

		return () => {
			document.removeEventListener("pointerdown", handlePointerDown);
			document.removeEventListener("pointermove", handlePointerMove);
			document.removeEventListener("pointerup", handlePointerUp);
			canvas.removeEventListener("mousemove", handleMouseMove);
			canvas.removeEventListener("touchstart", handleTouchStart);
			canvas.removeEventListener("touchmove", handleTouchMove);
			document.removeEventListener("touchend", handlePointerUp);
			removeEventListener("resize", handleWindowResize);
		};
	}, [boardSize, gameActionsNotReady]);

	const handleNewLevel = async () => {
		if (gameActionsNotReady && !boardGenerating) return;
		setBoardGenerating(true);
		console.log("test");
		const options: PuzzleConfig = { width: boardSize, height: boardSize };
		// const board = generateNumberlinkPuzzle(options).grid;
		const board = generateNumberLink(options);
		console.log(board);
		// const transformedBoard = board[0].map((row) => row.split(""));
		// console.log(board);
		// const colors = getDistancedColorArray();
		// for (let y = 0; y < transformedBoard.length; y++) {
		// 	for (let x = 0; x < transformedBoard[y].length; x++) {
		// 		if (transformedBoard[y][x] === ".") {
		// 			transformedBoard[y][x] = null;
		// 		} else {
		// 			transformedBoard[y][x] = { color: colors[transformedBoard[y][x]], isEndpoint: true };
		// 		}
		// 	}
		// }

		// console.log(transformedBoard);

		// // const board = await boardGeneratorRef.current?.generateBoard(boardSize);
		// setBoardGenerating(false);
		// // if (!board) return;

		// gameRef.current?.reset(transformedBoard);
		// const state = gameRef.current?.getState();
		// if (state) rendererRef.current?.render(state, boardSize);
	};

	useEffect(() => {
		handleNewLevel();
	}, [boardSize]);

	return (
		<div className="h-full w-full flex flex-col justify-evenly items-center gap-4 touch-none select-none">
			<div className="text-2xl font-bold text-neutral-content">ChromaPath</div>
			<div
				ref={canvasRef} // TODO: Improve view widths
				className="w-[99dvw] h-[99dvw] md:w-[80dvh] md:h-[80dvh] border border-neutral rounded-lg shadow-lg  overscroll-none overflow-hidden"
			/>
			<div className="flex gap-4">
				<button onClick={handleNewLevel} className="btn btn-primary m-auto">
					New Level
				</button>
				<select
					value={boardSize}
					onChange={(e) => setBoardSize(Number(e.target.value))}
					className="select w-full max-w-xs focus:outline-0 focus:border-0 m-auto"
				>
					{Array.from({ length: 22 }, (_, i) => (
						<option key={i + 4} value={i + 4}>
							{i + 4}x{i + 4}
						</option>
					))}
				</select>
				<label className="flex items-center space-x-2">
					<span>Show Numbers</span>
					<input
						type="checkbox"
						defaultChecked={false}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
							if (!gameRef.current || !rendererRef.current) return;
							rendererRef.current.showNumbers = e.target.checked;
							const state = gameRef.current.getState();
							if (state) rendererRef.current.render(state, boardSize);
						}}
						className="checkbox checkbox-neutral"
					/>
				</label>
			</div>
		</div>
	);
};

export default ChromaPath;

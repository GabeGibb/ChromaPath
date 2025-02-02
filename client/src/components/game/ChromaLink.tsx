import { BoardGenerator, generatePuzzle } from "@chromapath/shared";
import React, { useEffect, useRef, useState } from "react";
import { LocalStorageService } from "../../services/localStorage/localStorage";
import { ChromaPathGame } from "./GameLogic";
import { ChromaPathRenderer } from "./Renderer";

interface Props {
	initialSize?: number;
}

const ChromaPath: React.FC<Props> = ({ initialSize = 5 }) => {
	const canvasRef = useRef<HTMLDivElement>(null);
	const gameRef = useRef<ChromaPathGame | null>(null);
	const rendererRef = useRef<ChromaPathRenderer | null>(null);
	const boardGeneratorRef = useRef<BoardGenerator | null>(null);
	const [boardSize, setBoardSize] = useState(initialSize);
	const [boardGenerating, setBoardGenerating] = useState<boolean>(true);
	const [showNumbers, setShowNumbers] = useState<boolean>(LocalStorageService.getSettings()?.show_numbers || false);

	const gameActionsNotReady = !gameRef.current || !rendererRef.current || !rendererRef.current.initialized || boardGenerating;

	useEffect(() => {
		if (!canvasRef.current) return;
		async function initializeObjects() {
			rendererRef.current = new ChromaPathRenderer(canvasRef.current!);
			boardGeneratorRef.current = new BoardGenerator(null);
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
		const board = generatePuzzle({ width: boardSize, height: boardSize });
		console.log(board);
		// console.log(board);
		// const gen = new BoardGenerator(rendererRef.current);
		// const board = await gen.generateBoard(boardSize);

		// const transformedBoard = Array.from({ length: boardSize }, () => Array(boardSize).fill(null));

		// const colors = getDistancedColorArray();
		// for (let y = 0; y < boardSize; y++) {
		// 	for (let x = 0; x < boardSize; x++) {
		// 		if (board[0][y][x] === 0) {
		// 			transformedBoard[y][x] = null;
		// 		} else {
		// 			transformedBoard[y][x] = { color: colors[board[0][y][x]], isEndpoint: true };
		// 		}
		// 	}
		// }
		// console.log(colors);

		// console.log(transformedBoard);

		// // const board = await boardGeneratorRef.current?.generateBoard(boardSize);
		setBoardGenerating(false);
		if (!board) return;

		gameRef.current?.reset(board);
		const state = gameRef.current?.getState();
		if (state) rendererRef.current?.render(state, boardSize);
	};

	useEffect(() => {
		handleNewLevel();
	}, [boardSize]);

	useEffect(() => {
		if (!rendererRef.current) return;
		rendererRef.current.showNumbers = showNumbers;
	}, [showNumbers]);

	return (
		<div className="h-full w-full flex flex-col justify-evenly items-center gap-4 touch-none select-none">
			<div className="text-2xl font-bold text-neutral-content">ChromaLink</div>
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
						defaultChecked={LocalStorageService.getSettings()?.show_numbers}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
							if (!gameRef.current || !rendererRef.current) return;
							rendererRef.current.showNumbers = e.target.checked;

							LocalStorageService.setSettings({ show_numbers: e.target.checked });
						}}
						className="checkbox checkbox-neutral"
					/>
				</label>
			</div>
		</div>
	);
};

export default ChromaPath;

import { RefreshCcw } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { ChromaPathGame } from "../components/game/game-logic";
import { ChromaPathRenderer } from "../components/game/renderer";
import BoardService from "../services/board";
import { LocalStorageService } from "../services/localStorage/localStorage";

interface Props {
	initialSize?: number;
}

const Game: React.FC<Props> = ({ initialSize = 5 }) => {
	const canvasRef = useRef<HTMLDivElement>(null);
	const gameRef = useRef<ChromaPathGame | null>(null);
	const rendererRef = useRef<ChromaPathRenderer | null>(null);
	const [boardSize, setBoardSize] = useState(initialSize);
	const [boardGenerating, setBoardGenerating] = useState<boolean>(true);
	const [numPaths, setNumPaths] = useState<number>(0);

	const gameActionsNotReady = !gameRef.current || !rendererRef.current || !rendererRef.current.initialized || boardGenerating;

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

			game.handleMouseMove(x, y);
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

		const preventSideSwipe = (event: TouchEvent) => {
			// Check if the touch is within the canvas bounds
			if (event.touches[0].clientX !== 0) {
				event.preventDefault(); // Only prevent default for touches inside canvas
			}
		};

		// Feature detection for different input types
		const supportsPointerEvents = window.PointerEvent !== undefined;
		const supportsTouchEvents = "ontouchstart" in window || navigator.maxTouchPoints > 0;
		const supportsMouseEvents = true; // Almost all devices support mouse events

		// Now conditionally add the event listeners
		if (supportsPointerEvents) {
			// Use pointer events for devices that support them (most modern browsers)
			document.addEventListener("pointerdown", handlePointerDown);
			document.addEventListener("pointermove", handlePointerMove);
			document.addEventListener("pointerup", handlePointerUp);
		} else if (supportsTouchEvents) {
			// Fallback to touch events for older mobile devices
			canvas.addEventListener("touchstart", handleTouchStart);
			canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
			document.addEventListener("touchend", handlePointerUp);

			// Only add this touchmove prevention on touch devices
			// and only if the browser doesn't support pointer events
			document.addEventListener("touchmove", preventSideSwipe, { passive: false });
		}

		if (supportsMouseEvents) {
			// Mouse events - useful for desktop
			canvas.addEventListener("mousemove", handleMouseMove);
		}

		// Resize event is universal
		window.addEventListener("resize", handleWindowResize);

		// Clean up function with conditional removals
		return () => {
			if (supportsPointerEvents) {
				document.removeEventListener("pointerdown", handlePointerDown);
				document.removeEventListener("pointermove", handlePointerMove);
				document.removeEventListener("pointerup", handlePointerUp);
			} else if (supportsTouchEvents) {
				canvas.removeEventListener("touchstart", handleTouchStart);
				canvas.removeEventListener("touchmove", handleTouchMove);
				document.removeEventListener("touchend", handlePointerUp);
				document.removeEventListener("touchmove", preventSideSwipe);
			}
			if (supportsMouseEvents) {
				canvas.removeEventListener("mousemove", handleMouseMove);
			}

			window.removeEventListener("resize", handleWindowResize);
		};
	}, [boardSize, gameActionsNotReady]);

	const handleNewLevel = async () => {
		if (gameActionsNotReady && !boardGenerating) return;

		setBoardGenerating(true);

		// const boardGenerator = new BoardGenerator(rendererRef.current!);
		// const board = await boardGenerator.generateBoard(boardSize);
		// const board = generatePuzzle({ width: boardSize, height: boardSize });
		// console.log(board);
		const board = await BoardService.getRandomBoard(boardSize);

		setBoardGenerating(false);
		if (!board) return;

		gameRef.current?.reset(board);
		const state = gameRef.current?.getState();
		setNumPaths(state?.paths.length ?? 0);
		if (state) rendererRef.current?.render(state, boardSize);
	};

	useEffect(() => {
		handleNewLevel();
	}, [boardSize]);

	useEffect(() => {
		if (!canvasRef.current) return;
		rendererRef.current = new ChromaPathRenderer(canvasRef.current!);
		gameRef.current = new ChromaPathGame();
		handleNewLevel();

		return () => {
			rendererRef.current?.destroy();
		};
	}, []);

	useEffect(() => {
		if (!rendererRef.current) return;
		const settings = LocalStorageService.getSettings();
		const showNumbers = settings ? settings.show_numbers : false;
		rendererRef.current.showNumbers = showNumbers;
		rendererRef.current.render(gameRef.current?.getState()!, boardSize);
	}, []);

	return (
		<div className="h-full w-full flex flex-col justify-evenly items-center gap-4 touch-none select-none">
			<div className="text-2xl font-bold text-neutral-content">ChromaLink</div>
			<span>Paths: {numPaths}</span>
			<div
				ref={canvasRef} // TODO: Improve view widths
				className="w-[99dvw] h-[99dvw] md:w-[80dvh] md:h-[80dvh] border border-neutral shadow-lg overscroll-none overflow-hidden"
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
					{Array.from({ length: 14 }, (_, i) => (
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
							rendererRef.current.render(gameRef.current?.getState()!, boardSize);

							LocalStorageService.setSettings({ show_numbers: e.target.checked });
						}}
						className="checkbox checkbox-neutral"
					/>
				</label>
				<button
					onClick={() => {
						if (!gameRef.current || !rendererRef.current) return;
						gameRef.current?.refreshPaths();
						rendererRef.current.render(gameRef.current?.getState()!, boardSize);
					}}
					className="btn btn-primary m-auto"
				>
					<RefreshCcw size={24} />
				</button>
				<button onClick={() => {}}></button>
			</div>
		</div>
	);
};

export default Game;

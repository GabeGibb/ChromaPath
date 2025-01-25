import React, { useEffect, useRef, useState } from "react";
import { ChromaPathGame } from "./GameLogic";
import { ChromaPathRenderer } from "./Renderer";

interface Props {
	initialSize?: number;
}

const ChromaPath: React.FC<Props> = ({ initialSize = 5 }) => {
	const canvasRef = useRef<HTMLDivElement>(null);
	const gameRef = useRef<ChromaPathGame | null>(null);
	const rendererRef = useRef<ChromaPathRenderer | null>(null);
	const [boardSize, setBoardSize] = useState(initialSize);

	useEffect(() => {
		if (!canvasRef.current) return;
		gameRef.current = new ChromaPathGame(boardSize);
		rendererRef.current = new ChromaPathRenderer(canvasRef.current);

		const renderer = rendererRef.current;
		const game = gameRef.current;

		renderer.render(game.getState(), boardSize);

		return () => {
			renderer.destroy();
		};
	}, []);

	useEffect(() => {
		if (!gameRef.current || !rendererRef.current || !rendererRef.current.initialized) return;

		const canvas = rendererRef.current.getCanvas();
		const handleMouseMove = (event: MouseEvent) => {
			if (!gameRef.current || !rendererRef.current) return;

			const rect = canvas.getBoundingClientRect();
			const canvasWidth = rect.width;
			const cellSize = canvasWidth / boardSize;

			let x = Math.floor((event.clientX - rect.left) / cellSize);
			let y = Math.floor((event.clientY - rect.top) / cellSize);

			// Clamp x and y to be within bounds
			x = Math.max(0, Math.min(x, boardSize - 1));
			y = Math.max(0, Math.min(y, boardSize - 1));

			if (x >= 0 && x < boardSize && y >= 0 && y < boardSize) {
				gameRef.current?.handleMouseMove(x, y);
				rendererRef.current?.render(gameRef.current?.getState(), boardSize);
			}
		};

		const handlePointerDown = (event: PointerEvent | Touch) => {
			if (!gameRef.current || !rendererRef.current) return;

			const rect = canvas.getBoundingClientRect();
			const canvasWidth = rect.width;
			const cellSize = canvasWidth / boardSize;

			const x = Math.floor((event.clientX - rect.left) / cellSize);
			const y = Math.floor((event.clientY - rect.top) / cellSize);
			// Clamp x and y to be within bounds
			const clampedX = Math.max(0, Math.min(x, boardSize - 1));
			const clampedY = Math.max(0, Math.min(y, boardSize - 1));

			gameRef.current?.handleCellClick(clampedX, clampedY);
			rendererRef.current?.render(gameRef.current?.getState(), boardSize);
		};

		const handlePointerMove = (event: PointerEvent | Touch) => {
			if (!gameRef.current || !rendererRef.current) return;

			const rect = canvas.getBoundingClientRect();
			const canvasWidth = rect.width;
			const cellSize = canvasWidth / boardSize;

			const x = Math.floor((event.clientX - rect.left) / cellSize);
			const y = Math.floor((event.clientY - rect.top) / cellSize);
			// Clamp x and y to be within bounds
			const clampedX = Math.max(0, Math.min(x, boardSize - 1));
			const clampedY = Math.max(0, Math.min(y, boardSize - 1));

			gameRef.current?.handleDrag(clampedX, clampedY);
			rendererRef.current?.render(gameRef.current?.getState(), boardSize);
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
			if (!gameRef.current || !rendererRef.current) return;

			const gameComplete = gameRef.current?.endDrag();
			rendererRef.current?.render(gameRef.current?.getState(), boardSize);

			if (gameComplete) {
				handleNewLevel();
			}
		};
		const handleWindowResize = () => {
			if (!gameRef.current || !rendererRef.current) return;
			rendererRef.current.resize(canvasRef.current!);
			rendererRef.current?.render(gameRef.current?.getState(), boardSize);
		};

		document.addEventListener("pointerdown", handlePointerDown);
		document.addEventListener("pointermove", handlePointerMove);
		document.addEventListener("pointerup", handlePointerUp);
		canvas.addEventListener("mousemove", handleMouseMove);
		canvas.addEventListener("touchstart", handleTouchStart);
		canvas.addEventListener("touchmove", handleTouchMove);
		document.addEventListener("touchend", handlePointerUp);
		addEventListener("resize", handleWindowResize);

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
	}, [boardSize]);

	const handleNewLevel = () => {
		if (!gameRef.current || !rendererRef.current) return;
		gameRef.current?.reset(boardSize);
		rendererRef.current?.render(gameRef.current?.getState(), boardSize);
	};

	useEffect(() => {
		handleNewLevel();
	}, [boardSize]);

	return (
		<div className="h-full w-full flex flex-col justify-evenly items-center gap-4 touch-none">
			<div className="text-2xl font-bold text-neutral-content">ChromaPath</div>
			<div
				ref={canvasRef}
				className="w-screen h-[100vw] md:w-[85vh] md:h-[85vh] border border-neutral rounded-lg shadow-lg"
			/>
			<div className="flex gap-4">
				<button onClick={handleNewLevel} className="btn btn-primary">
					New Level
				</button>
				<select
					value={boardSize}
					onChange={(e) => setBoardSize(Number(e.target.value))}
					className="select w-full max-w-xs focus:outline-0 focus:border-0"
				>
					{Array.from({ length: 22 }, (_, i) => (
						<option key={i + 4} value={i + 4}>
							{i + 4}x{i + 4}
						</option>
					))}
				</select>
			</div>
		</div>
	);
};

export default ChromaPath;

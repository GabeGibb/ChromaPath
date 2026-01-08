import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import {
  Canvas,
  Path,
  Circle,
  Group,
  Skia,
  Rect,
  Line,
  vec,
  Text as SkiaText,
  useFont,
  useCanvasRef,
} from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useDerivedValue,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';

import { useGameStore } from '@/stores/gameStore';
import { getDistancedColorArray, Point } from '@chromapath/shared-types';

// Get the color array once at module level
const COLORS = getDistancedColorArray();
const SKIA_COLORS = COLORS.map((rgbString) => {
  const match = rgbString.match(/rgb\(([\d.]+),\s*([\d.]+),\s*([\d.]+)\)/);
  if (match) {
    const r = Math.round(parseFloat(match[1])).toString(16).padStart(2, '0');
    const g = Math.round(parseFloat(match[2])).toString(16).padStart(2, '0');
    const b = Math.round(parseFloat(match[3])).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }
  return '#ff0000';
});

function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#ffffff';
}

// Path data structure for rendering
interface PathRenderData {
  pathIndex: number;
  points: Point[];
  color: string;
}

export function GameBoard() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const canvasRef = useCanvasRef();

  // Get values from store
  const boardWidth = useGameStore((s) => s.boardWidth);
  const boardHeight = useGameStore((s) => s.boardHeight);
  const showNumbers = useGameStore((s) => s.showNumbers);
  const initialBoard = useGameStore((s) => s.board);
  const initialGameState = useGameStore((s) => s.gameState);

  // Version counter to trigger minimal re-renders when paths change
  const [pathVersion, setPathVersion] = useState(0);

  // Refs for path data (no re-renders when updated)
  const pathsRef = useRef<PathRenderData[]>([]);
  const currentPathIdxRef = useRef(-1);
  const endpointsRef = useRef<{ x: number; y: number; pathIndex: number }[]>([]);

  // Calculate dimensions
  const padding = 8;
  const maxWidth = screenWidth - padding * 2;
  const maxHeight = screenHeight * 0.68;
  const cellSize = Math.min(maxWidth / boardWidth, maxHeight / boardHeight);
  const actualWidth = cellSize * boardWidth;
  const actualHeight = cellSize * boardHeight;
  const halfCell = cellSize / 2;

  // Load font
  const font = useFont(require('@expo-google-fonts/comfortaa/Comfortaa_700Bold.ttf'), cellSize * 0.38);

  // Shared values for fluid line (UI thread)
  const preciseX = useSharedValue(-1);
  const preciseY = useSharedValue(-1);
  const isDragging = useSharedValue(false);
  const lastCellX = useSharedValue(-1);
  const lastCellY = useSharedValue(-1);

  // Last point of current path for fluid line (as shared values)
  const lastPointX = useSharedValue(-1);
  const lastPointY = useSharedValue(-1);
  const fluidColor = useSharedValue('#ffffff');

  // Extract endpoints once when board changes
  useEffect(() => {
    const board = useGameStore.getState().board;
    if (!board) return;

    const eps: { x: number; y: number; pathIndex: number }[] = [];
    board.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell?.isEndpoint) {
          eps.push({ x, y, pathIndex: cell.pathIndex });
        }
      });
    });
    endpointsRef.current = eps;

    // Initial path data
    const gameState = useGameStore.getState().gameState;
    if (gameState) {
      updatePathsRef(gameState.paths, gameState.currentPathIndex ?? -1);
      setPathVersion(v => v + 1);
    }
  }, [initialBoard]);

  // Update paths ref without triggering re-render
  const updatePathsRef = useCallback((paths: Point[][], currentIdx: number) => {
    pathsRef.current = paths.map((points, idx) => ({
      pathIndex: idx,
      points,
      color: SKIA_COLORS[idx] || '#ffffff',
    }));
    currentPathIdxRef.current = currentIdx;

    // Update fluid line shared values
    if (currentIdx >= 0 && paths[currentIdx]?.length > 0) {
      const lastPt = paths[currentIdx][paths[currentIdx].length - 1];
      lastPointX.value = lastPt.x;
      lastPointY.value = lastPt.y;
      fluidColor.value = SKIA_COLORS[currentIdx] || '#ffffff';
    } else {
      lastPointX.value = -1;
      lastPointY.value = -1;
    }
  }, []);

  // JS callbacks for game logic
  const handleCellChange = useCallback((cellX: number, cellY: number, isStart: boolean) => {
    const state = useGameStore.getState();
    if (!state.game || state.isCompleted) return;

    if (isStart) {
      state.game.handleCellClick(cellX, cellY);
    } else {
      state.game.handleMouseMove(cellX, cellY);
      const completed = state.game.handleDrag(cellX, cellY);

      if (completed) {
        state.stopTimer();
        useGameStore.setState({ isCompleted: true });
      }
    }

    // Update refs and trigger re-render
    const gameState = state.game.getState();
    updatePathsRef(gameState.paths, gameState.currentPathIndex ?? -1);
    setPathVersion(v => v + 1);
  }, [updatePathsRef]);

  // Track if drag end was already handled to prevent double calls
  const dragEndHandledRef = useRef(false);

  const resetDragEndFlag = useCallback(() => {
    dragEndHandledRef.current = false;
  }, []);

  const handleDragEnd = useCallback(() => {
    // Prevent double calls from onEnd and onFinalize
    if (dragEndHandledRef.current) return;
    dragEndHandledRef.current = true;

    const state = useGameStore.getState();
    if (!state.game || state.isCompleted) return;

    state.game.endDrag();

    // Update paths ref
    const gameState = state.game.getState();
    updatePathsRef(gameState.paths, gameState.currentPathIndex ?? -1);
    setPathVersion(v => v + 1);

    // Update Zustand for stats
    useGameStore.setState({
      numConnectedPaths: gameState.numConnectedPaths,
      gameState: gameState,
      board: gameState.board,
    });
  }, [updatePathsRef]);

  // Gesture handler
  const panGesture = useMemo(() =>
    Gesture.Pan()
      .onBegin((event) => {
        'worklet';
        const cellX = Math.floor(event.x / cellSize);
        const cellY = Math.floor(event.y / cellSize);
        const clampedX = Math.max(0, Math.min(cellX, boardWidth - 1));
        const clampedY = Math.max(0, Math.min(cellY, boardHeight - 1));

        preciseX.value = event.x / cellSize;
        preciseY.value = event.y / cellSize;
        isDragging.value = true;
        lastCellX.value = clampedX;
        lastCellY.value = clampedY;

        runOnJS(resetDragEndFlag)();
        runOnJS(handleCellChange)(clampedX, clampedY, true);
      })
      .onUpdate((event) => {
        'worklet';
        preciseX.value = event.x / cellSize;
        preciseY.value = event.y / cellSize;

        const cellX = Math.floor(event.x / cellSize);
        const cellY = Math.floor(event.y / cellSize);
        const clampedX = Math.max(0, Math.min(cellX, boardWidth - 1));
        const clampedY = Math.max(0, Math.min(cellY, boardHeight - 1));

        if (lastCellX.value !== clampedX || lastCellY.value !== clampedY) {
          lastCellX.value = clampedX;
          lastCellY.value = clampedY;
          runOnJS(handleCellChange)(clampedX, clampedY, false);
        }
      })
      .onEnd(() => {
        'worklet';
        isDragging.value = false;
        preciseX.value = -1;
        preciseY.value = -1;
        lastCellX.value = -1;
        lastCellY.value = -1;
        runOnJS(handleDragEnd)();
      })
      .onFinalize(() => {
        'worklet';
        isDragging.value = false;
        preciseX.value = -1;
        preciseY.value = -1;
        lastCellX.value = -1;
        lastCellY.value = -1;
        runOnJS(handleDragEnd)();
      })
  , [cellSize, boardWidth, boardHeight, handleCellChange, handleDragEnd, resetDragEndFlag]);

  // Build grid path once
  const gridPath = useMemo(() => {
    const p = Skia.Path.Make();
    for (let i = 0; i <= boardWidth; i++) {
      p.moveTo(i * cellSize, 0);
      p.lineTo(i * cellSize, boardHeight * cellSize);
    }
    for (let i = 0; i <= boardHeight; i++) {
      p.moveTo(0, i * cellSize);
      p.lineTo(boardWidth * cellSize, i * cellSize);
    }
    return p;
  }, [boardWidth, boardHeight, cellSize]);

  // Memoized endpoints
  const endpoints = endpointsRef.current;

  if (!initialBoard || !initialGameState) {
    return null;
  }

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={{ width: actualWidth, height: actualHeight }}>
        <Canvas ref={canvasRef} style={{ flex: 1 }}>
          {/* Background */}
          <Rect x={0} y={0} width={actualWidth} height={actualHeight} color="rgba(0, 0, 0, 0.5)" />

          {/* Grid lines */}
          <Path path={gridPath} color="rgba(255, 255, 255, 0.3)" style="stroke" strokeWidth={1} />

          {/* Paths - rendered from ref, re-render triggered by pathVersion */}
          <PathsRenderer
            pathsRef={pathsRef}
            pathVersion={pathVersion}
            cellSize={cellSize}
            halfCell={halfCell}
          />

          {/* Fluid line */}
          <FluidLine
            lastPointX={lastPointX}
            lastPointY={lastPointY}
            fluidColor={fluidColor}
            preciseX={preciseX}
            preciseY={preciseY}
            isDragging={isDragging}
            cellSize={cellSize}
            halfCell={halfCell}
            boardWidth={boardWidth}
            boardHeight={boardHeight}
          />

          {/* Endpoints (static) */}
          {endpoints.map((ep) => (
            <Group key={`endpoint-${ep.x}-${ep.y}`}>
              <Circle
                cx={ep.x * cellSize + halfCell}
                cy={ep.y * cellSize + halfCell}
                r={cellSize / 3}
                color={SKIA_COLORS[ep.pathIndex] || '#ffffff'}
              />
              {showNumbers && font && (
                <SkiaText
                  x={ep.x * cellSize + halfCell - font.measureText((ep.pathIndex + 1).toString()).width / 2}
                  y={ep.y * cellSize + halfCell + cellSize * 0.14}
                  text={(ep.pathIndex + 1).toString()}
                  font={font}
                  color={getContrastColor(SKIA_COLORS[ep.pathIndex] || '#ffffff')}
                />
              )}
            </Group>
          ))}
        </Canvas>
      </Animated.View>
    </GestureDetector>
  );
}

// Paths renderer - reads from ref, triggered by version change
const PathsRenderer = React.memo(function PathsRenderer({
  pathsRef,
  pathVersion,
  cellSize,
  halfCell,
}: {
  pathsRef: React.RefObject<PathRenderData[]>;
  pathVersion: number;
  cellSize: number;
  halfCell: number;
}) {
  // Build Skia paths from the ref data
  const skiaPathsData = useMemo(() => {
    const paths = pathsRef.current;
    return paths.map((pathData) => {
      const { pathIndex, points, color } = pathData;

      // Build stroke path
      const strokePath = Skia.Path.Make();
      if (points.length > 0) {
        strokePath.moveTo(points[0].x * cellSize + halfCell, points[0].y * cellSize + halfCell);
        for (let i = 1; i < points.length; i++) {
          strokePath.lineTo(points[i].x * cellSize + halfCell, points[i].y * cellSize + halfCell);
        }
      }

      // Build fill path
      const fillPath = Skia.Path.Make();
      for (const pt of points) {
        fillPath.addRect(Skia.XYWHRect(pt.x * cellSize, pt.y * cellSize, cellSize, cellSize));
      }

      return { pathIndex, strokePath, fillPath, color };
    });
  }, [pathVersion, cellSize, halfCell]);

  return (
    <>
      {skiaPathsData.map((data) => (
        <Group key={data.pathIndex}>
          <Path path={data.fillPath} color={`${data.color}20`} />
          <Path
            path={data.strokePath}
            color={data.color}
            style="stroke"
            strokeWidth={cellSize / 4}
            strokeCap="round"
            strokeJoin="round"
          />
        </Group>
      ))}
    </>
  );
});

// Fluid line component - uses shared values for smooth UI thread animation
function FluidLine({
  lastPointX,
  lastPointY,
  fluidColor,
  preciseX,
  preciseY,
  isDragging,
  cellSize,
  halfCell,
  boardWidth,
  boardHeight,
}: {
  lastPointX: SharedValue<number>;
  lastPointY: SharedValue<number>;
  fluidColor: SharedValue<string>;
  preciseX: SharedValue<number>;
  preciseY: SharedValue<number>;
  isDragging: SharedValue<boolean>;
  cellSize: number;
  halfCell: number;
  boardWidth: number;
  boardHeight: number;
}) {
  const p1 = useDerivedValue(() => {
    if (lastPointX.value < 0 || lastPointY.value < 0) {
      return vec(0, 0);
    }
    return vec(lastPointX.value * cellSize + halfCell, lastPointY.value * cellSize + halfCell);
  });

  const p2 = useDerivedValue(() => {
    if (!isDragging.value || preciseX.value < 0 || preciseY.value < 0 || lastPointX.value < 0) {
      return p1.value;
    }

    const lastCenterX = lastPointX.value * cellSize + halfCell;
    const lastCenterY = lastPointY.value * cellSize + halfCell;
    const mouseX = preciseX.value * cellSize;
    const mouseY = preciseY.value * cellSize;
    const deltaX = mouseX - lastCenterX;
    const deltaY = mouseY - lastCenterY;

    let targetX = lastCenterX;
    let targetY = lastCenterY;

    // Direction-based movement
    const isPrimaryHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
    const lpx = lastPointX.value;
    const lpy = lastPointY.value;

    if (isPrimaryHorizontal) {
      if (deltaX > 0 && lpx + 1 < boardWidth) {
        targetX = Math.min(mouseX, (lpx + 1) * cellSize + halfCell);
      } else if (deltaX < 0 && lpx - 1 >= 0) {
        targetX = Math.max(mouseX, (lpx - 1) * cellSize + halfCell);
      } else if (deltaY > 0 && lpy + 1 < boardHeight) {
        targetY = Math.min(mouseY, (lpy + 1) * cellSize + halfCell);
      } else if (deltaY < 0 && lpy - 1 >= 0) {
        targetY = Math.max(mouseY, (lpy - 1) * cellSize + halfCell);
      }
    } else {
      if (deltaY > 0 && lpy + 1 < boardHeight) {
        targetY = Math.min(mouseY, (lpy + 1) * cellSize + halfCell);
      } else if (deltaY < 0 && lpy - 1 >= 0) {
        targetY = Math.max(mouseY, (lpy - 1) * cellSize + halfCell);
      } else if (deltaX > 0 && lpx + 1 < boardWidth) {
        targetX = Math.min(mouseX, (lpx + 1) * cellSize + halfCell);
      } else if (deltaX < 0 && lpx - 1 >= 0) {
        targetX = Math.max(mouseX, (lpx - 1) * cellSize + halfCell);
      }
    }

    return vec(targetX, targetY);
  });

  return (
    <Line
      p1={p1}
      p2={p2}
      color={fluidColor}
      style="stroke"
      strokeWidth={cellSize / 4}
      strokeCap="round"
    />
  );
}

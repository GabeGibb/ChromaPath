import React, { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { Canvas, Path, Circle, Text, useFont, Group, Skia, RadialGradient, vec, Rect } from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

import { useGameStore } from '@/stores/gameStore';
import { getDistancedColorArray, Point } from '@chromapath/shared-types';

// Get the color array once
const COLORS = getDistancedColorArray();

// Parse rgb string to Skia color
function parseRgbToSkiaColor(rgbString: string): string {
  // rgb(r, g, b) -> #rrggbb
  const match = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (match) {
    const r = parseInt(match[1]).toString(16).padStart(2, '0');
    const g = parseInt(match[2]).toString(16).padStart(2, '0');
    const b = parseInt(match[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }
  return '#ffffff';
}

// Get high contrast color for text
function getHighContrastColor(rgbString: string): string {
  const match = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (match) {
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 125 ? '#000000' : '#ffffff';
  }
  return '#000000';
}

export function GameBoard() {
  const { width: screenWidth } = useWindowDimensions();
  const {
    board,
    gameState,
    handleCellClick,
    handleDrag,
    handleMouseMove,
    setPreciseMouse,
    endDrag,
  } = useGameStore();

  // Calculate dimensions
  const boardWidth = board?.[0]?.length ?? 5;
  const boardHeight = board?.length ?? 5;
  const padding = 16;
  const canvasSize = screenWidth - padding * 2;
  const cellSize = canvasSize / Math.max(boardWidth, boardHeight);
  const actualWidth = cellSize * boardWidth;
  const actualHeight = cellSize * boardHeight;

  // Shared values for gesture tracking
  const isDragging = useSharedValue(false);
  const lastCellX = useSharedValue(-1);
  const lastCellY = useSharedValue(-1);

  // Gesture handler
  const panGesture = Gesture.Pan()
    .onBegin((event) => {
      const x = Math.floor(event.x / cellSize);
      const y = Math.floor(event.y / cellSize);
      const clampedX = Math.max(0, Math.min(x, boardWidth - 1));
      const clampedY = Math.max(0, Math.min(y, boardHeight - 1));

      isDragging.value = true;
      lastCellX.value = clampedX;
      lastCellY.value = clampedY;

      runOnJS(handleCellClick)(clampedX, clampedY);
    })
    .onUpdate((event) => {
      const preciseX = event.x / cellSize;
      const preciseY = event.y / cellSize;
      const x = Math.floor(preciseX);
      const y = Math.floor(preciseY);
      const clampedX = Math.max(0, Math.min(x, boardWidth - 1));
      const clampedY = Math.max(0, Math.min(y, boardHeight - 1));

      runOnJS(setPreciseMouse)(preciseX, preciseY);
      runOnJS(handleMouseMove)(x, y);
      runOnJS(handleDrag)(clampedX, clampedY);

      lastCellX.value = clampedX;
      lastCellY.value = clampedY;
    })
    .onEnd(() => {
      isDragging.value = false;
      runOnJS(endDrag)();
    })
    .onFinalize(() => {
      isDragging.value = false;
      runOnJS(endDrag)();
    });

  // Memoize parsed colors
  const skiaColors = useMemo(() => COLORS.map(parseRgbToSkiaColor), []);

  if (!board || !gameState) {
    return null;
  }

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={{ width: actualWidth, height: actualHeight }}>
        <Canvas style={{ width: actualWidth, height: actualHeight }}>
          {/* Background */}
          <Rect
            x={0}
            y={0}
            width={actualWidth}
            height={actualHeight}
            color="rgba(0, 0, 0, 0.5)"
          />

          {/* Grid lines */}
          <GridLines
            boardWidth={boardWidth}
            boardHeight={boardHeight}
            cellSize={cellSize}
          />

          {/* Paths */}
          {gameState.paths.map((path, pathIndex) => (
            <GamePath
              key={pathIndex}
              path={path}
              color={skiaColors[pathIndex]}
              cellSize={cellSize}
              isCurrentPath={gameState.currentPathIndex === pathIndex}
              preciseMouseX={gameState.preciseMouseX}
              preciseMouseY={gameState.preciseMouseY}
            />
          ))}

          {/* Endpoints */}
          {board.map((row, y) =>
            row.map((cell, x) => {
              if (cell?.isEndpoint) {
                return (
                  <Endpoint
                    key={`${x}-${y}`}
                    x={x}
                    y={y}
                    pathIndex={cell.pathIndex}
                    cellSize={cellSize}
                    color={skiaColors[cell.pathIndex]}
                  />
                );
              }
              return null;
            })
          )}
        </Canvas>
      </Animated.View>
    </GestureDetector>
  );
}

// Grid lines component
interface GridLinesProps {
  boardWidth: number;
  boardHeight: number;
  cellSize: number;
}

function GridLines({ boardWidth, boardHeight, cellSize }: GridLinesProps) {
  const path = useMemo(() => {
    const p = Skia.Path.Make();

    // Vertical lines
    for (let i = 0; i <= boardWidth; i++) {
      p.moveTo(i * cellSize, 0);
      p.lineTo(i * cellSize, boardHeight * cellSize);
    }

    // Horizontal lines
    for (let i = 0; i <= boardHeight; i++) {
      p.moveTo(0, i * cellSize);
      p.lineTo(boardWidth * cellSize, i * cellSize);
    }

    return p;
  }, [boardWidth, boardHeight, cellSize]);

  return (
    <Path
      path={path}
      color="rgba(255, 255, 255, 0.3)"
      style="stroke"
      strokeWidth={1}
    />
  );
}

// Path drawing component
interface GamePathProps {
  path: Point[];
  color: string;
  cellSize: number;
  isCurrentPath: boolean;
  preciseMouseX: number;
  preciseMouseY: number;
}

function GamePath({ path, color, cellSize, isCurrentPath, preciseMouseX, preciseMouseY }: GamePathProps) {
  const skiaPath = useMemo(() => {
    if (path.length < 1) return null;

    const p = Skia.Path.Make();
    const halfCell = cellSize / 2;

    // Move to first point center
    p.moveTo(
      path[0].x * cellSize + halfCell,
      path[0].y * cellSize + halfCell
    );

    // Draw lines to subsequent points
    for (let i = 1; i < path.length; i++) {
      p.lineTo(
        path[i].x * cellSize + halfCell,
        path[i].y * cellSize + halfCell
      );
    }

    return p;
  }, [path, cellSize]);

  if (!skiaPath || path.length < 1) return null;

  return (
    <Group>
      {/* Path cell fills */}
      {path.map((point, i) => (
        <Rect
          key={i}
          x={point.x * cellSize}
          y={point.y * cellSize}
          width={cellSize}
          height={cellSize}
          color={`${color}15`}
        />
      ))}

      {/* Path line */}
      <Path
        path={skiaPath}
        color={color}
        style="stroke"
        strokeWidth={cellSize / 4}
        strokeCap="round"
        strokeJoin="round"
      />
    </Group>
  );
}

// Endpoint component
interface EndpointProps {
  x: number;
  y: number;
  pathIndex: number;
  cellSize: number;
  color: string;
}

function Endpoint({ x, y, cellSize, color }: EndpointProps) {
  const centerX = x * cellSize + cellSize / 2;
  const centerY = y * cellSize + cellSize / 2;
  const radius = cellSize / 3;

  return (
    <Circle
      cx={centerX}
      cy={centerY}
      r={radius}
      color={color}
    />
  );
}

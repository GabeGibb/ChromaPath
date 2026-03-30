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
  BlurMask,
  RoundedRect,
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
  length: number; // Track length for change detection
}

// Cached Skia path data
interface CachedSkiaPath {
  pathIndex: number;
  strokePath: ReturnType<typeof Skia.Path.Make>;
  fillPath: ReturnType<typeof Skia.Path.Make>;
  color: string;
  pointCount: number; // For change detection
  lastPointHash: string; // Hash of last point for backtrack detection
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


  // Calculate dimensions - fit between header and footer
  // Reserve space for header (~60px) + footer (~60px) + safe areas (~100px)
  const padding = 8;
  const chromeHeight = 220;
  const maxWidth = screenWidth - padding * 2;
  const maxHeight = screenHeight - chromeHeight;
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

  // Track if we need a render
  const needsRenderRef = useRef(false);
  const lastRenderTimeRef = useRef(0);
  const renderIntervalRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);

  // Debug timing
  const debugTimingRef = useRef({ lastCellTime: 0, cellCount: 0, totalProcessTime: 0 });

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

  // Update paths ref - returns true if anything changed
  // skipRender: if true, don't trigger React re-render (for during-drag updates)
  const updatePathsRef = useCallback((paths: Point[][], currentIdx: number, skipRender: boolean = false): boolean => {
    const oldPaths = pathsRef.current;
    let changed = false;

    // Check if any path lengths changed (quick check)
    if (oldPaths.length !== paths.length) {
      changed = true;
    } else {
      for (let i = 0; i < paths.length; i++) {
        if (oldPaths[i]?.length !== paths[i].length) {
          changed = true;
          break;
        }
      }
    }

    if (changed) {
      pathsRef.current = paths.map((points, idx) => ({
        pathIndex: idx,
        points,
        color: SKIA_COLORS[idx] || '#ffffff',
        length: points.length,
      }));

      // Track that we need a render when drag ends
      if (skipRender) {
        needsRenderRef.current = true;
      }
    }

    currentPathIdxRef.current = currentIdx;

    // Only update fluid line anchor when NOT skipping render
    // This prevents the gap where fluid line jumps ahead of rendered path
    if (!skipRender) {
      if (currentIdx >= 0 && paths[currentIdx]?.length > 0) {
        const currentPath = paths[currentIdx];
        const lastPt = currentPath[currentPath.length - 1];

        // Check if path is connected (last point is an endpoint and path has > 1 point)
        const endpoints = endpointsRef.current;
        const isLastPointEndpoint = endpoints.some(
          ep => ep.pathIndex === currentIdx && ep.x === lastPt.x && ep.y === lastPt.y
        );
        const pathConnected = currentPath.length > 1 && isLastPointEndpoint;

        if (pathConnected) {
          lastPointX.value = -1;
          lastPointY.value = -1;
        } else {
          lastPointX.value = lastPt.x;
          lastPointY.value = lastPt.y;
          fluidColor.value = SKIA_COLORS[currentIdx] || '#ffffff';
        }
      } else {
        lastPointX.value = -1;
        lastPointY.value = -1;
      }
    } else {
      // During skipRender, just update color if needed
      if (currentIdx >= 0) {
        fluidColor.value = SKIA_COLORS[currentIdx] || '#ffffff';
      }
    }

    return changed;
  }, []);

  // Process a single cell change
  const processCellChange = useCallback((cellX: number, cellY: number, isStart: boolean): void => {
    const startTime = performance.now();

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
        // Trigger immediate render for completion
        const gameState = state.game.getState();
        updatePathsRef(gameState.paths, gameState.currentPathIndex ?? -1, false);
        setPathVersion(v => v + 1);
        return;
      }
    }

    // Update refs but skip React re-render during drag - render loop handles it
    const gameState = state.game.getState();
    updatePathsRef(gameState.paths, gameState.currentPathIndex ?? -1, true);

    // Debug timing
    const elapsed = performance.now() - startTime;
    debugTimingRef.current.cellCount++;
    debugTimingRef.current.totalProcessTime += elapsed;
    if (elapsed > 5) {
      console.log(`[PERF] processCellChange took ${elapsed.toFixed(1)}ms`);
    }
  }, [updatePathsRef]);

  // Sync fluid line anchor to match rendered path
  const syncFluidLineAnchor = useCallback(() => {
    const currentIdx = currentPathIdxRef.current;
    const paths = pathsRef.current;

    if (currentIdx >= 0 && paths[currentIdx]?.points.length > 0) {
      const currentPath = paths[currentIdx].points;
      const lastPt = currentPath[currentPath.length - 1];

      // Check if path is connected
      const endpoints = endpointsRef.current;
      const isLastPointEndpoint = endpoints.some(
        ep => ep.pathIndex === currentIdx && ep.x === lastPt.x && ep.y === lastPt.y
      );
      const pathConnected = currentPath.length > 1 && isLastPointEndpoint;

      if (pathConnected) {
        lastPointX.value = -1;
        lastPointY.value = -1;
      } else {
        lastPointX.value = lastPt.x;
        lastPointY.value = lastPt.y;
      }
    }
  }, []);

  // Process cell change immediately for responsive feedback
  const handleCellChange = useCallback((cellX: number, cellY: number, isStart: boolean) => {
    // Process immediately - no batching for maximum responsiveness
    processCellChange(cellX, cellY, isStart);

    // For start events, also sync fluid line and trigger immediate render
    if (isStart) {
      syncFluidLineAnchor();
      setPathVersion(v => v + 1);
    }
  }, [processCellChange, syncFluidLineAnchor]);

  // Track if drag end was already handled to prevent double calls
  const dragEndHandledRef = useRef(false);

  const resetDragEndFlag = useCallback(() => {
    dragEndHandledRef.current = false;
  }, []);

  // Start render loop during drag using requestAnimationFrame for 60fps
  const startPeriodicRender = useCallback(() => {
    if (renderIntervalRef.current) return;
    lastRenderTimeRef.current = Date.now();

    const renderLoop = () => {
      if (!renderIntervalRef.current) return; // Stop if cleared

      if (needsRenderRef.current) {
        const renderStart = performance.now();
        syncFluidLineAnchor();
        setPathVersion(v => v + 1);
        needsRenderRef.current = false;
        const renderElapsed = performance.now() - renderStart;
        if (renderElapsed > 2) {
          console.log(`[PERF] Render trigger took ${renderElapsed.toFixed(1)}ms`);
        }
        lastRenderTimeRef.current = Date.now();
      }

      // Continue loop
      renderIntervalRef.current = requestAnimationFrame(renderLoop);
    };

    renderIntervalRef.current = requestAnimationFrame(renderLoop);
  }, [syncFluidLineAnchor]);

  // Stop render loop
  const stopPeriodicRender = useCallback(() => {
    if (renderIntervalRef.current) {
      cancelAnimationFrame(renderIntervalRef.current);
      renderIntervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (renderIntervalRef.current) {
        cancelAnimationFrame(renderIntervalRef.current);
      }
    };
  }, []);

  const handleDragEnd = useCallback(() => {
    // Prevent double calls from onEnd and onFinalize
    if (dragEndHandledRef.current) return;
    dragEndHandledRef.current = true;

    // Log debug stats
    const debug = debugTimingRef.current;
    if (debug.cellCount > 0) {
      console.log(`[PERF] Drag ended: ${debug.cellCount} cells, avg ${(debug.totalProcessTime / debug.cellCount).toFixed(2)}ms per cell`);
      debug.cellCount = 0;
      debug.totalProcessTime = 0;
    }

    // Stop render loop
    stopPeriodicRender();

    const state = useGameStore.getState();
    if (!state.game || state.isCompleted) return;

    state.game.endDrag();

    // Update paths ref (not skipping render this time)
    const gameState = state.game.getState();
    updatePathsRef(gameState.paths, gameState.currentPathIndex ?? -1, false);

    // Trigger final render to ensure all path segments are shown
    setPathVersion(v => v + 1);
    needsRenderRef.current = false;

    // Update Zustand for stats
    useGameStore.setState({
      numConnectedPaths: gameState.numConnectedPaths,
      gameState: gameState,
      board: gameState.board,
    });
  }, [updatePathsRef, stopPeriodicRender]);

  // Called from worklet to start periodic rendering
  const handleDragStart = useCallback(() => {
    startPeriodicRender();
  }, [startPeriodicRender]);

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
        runOnJS(handleDragStart)();
        runOnJS(handleCellChange)(clampedX, clampedY, true);
      })
      .onUpdate((event) => {
        'worklet';
        const cellX = Math.floor(event.x / cellSize);
        const cellY = Math.floor(event.y / cellSize);

        // Check if touch is within board bounds
        const isInBounds = cellX >= 0 && cellX < boardWidth && cellY >= 0 && cellY < boardHeight;

        if (isInBounds) {
          preciseX.value = event.x / cellSize;
          preciseY.value = event.y / cellSize;

          if (lastCellX.value !== cellX || lastCellY.value !== cellY) {
            lastCellX.value = cellX;
            lastCellY.value = cellY;
            runOnJS(handleCellChange)(cellX, cellY, false);
          }
        } else {
          // Outside board - hide fluid line visual but keep dragging state
          preciseX.value = -1;
          preciseY.value = -1;
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
  , [cellSize, boardWidth, boardHeight, handleCellChange, handleDragEnd, handleDragStart, resetDragEndFlag]);

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
          <Rect x={0} y={0} width={actualWidth} height={actualHeight} color="#1a1a2e" />

          {/* Grid lines */}
          <Path path={gridPath} color="rgba(255, 255, 255, 0.12)" style="stroke" strokeWidth={1} />

          {/* Cell highlight glow - rendered before paths for layering */}
          <CellHighlightGlow
            lastCellX={lastCellX}
            lastCellY={lastCellY}
            preciseX={preciseX}
            preciseY={preciseY}
            isDragging={isDragging}
            fluidColor={fluidColor}
            cellSize={cellSize}
          />

          {/* Paths - rendered from ref, re-render triggered by pathVersion */}
          <PathsRenderer
            pathsRef={pathsRef}
            pathVersion={pathVersion}
            cellSize={cellSize}
            halfCell={halfCell}
            currentPathIdx={currentPathIdxRef.current}
          />

          {/* Touch glow effect - follows finger position */}
          <TouchGlow
            preciseX={preciseX}
            preciseY={preciseY}
            isDragging={isDragging}
            fluidColor={fluidColor}
            cellSize={cellSize}
          />

          {/* Fluid line with glow */}
          <FluidLineWithGlow
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

          {/* Endpoints with glow (memoized) */}
          <EndpointsRenderer
            endpoints={endpoints}
            cellSize={cellSize}
            halfCell={halfCell}
            showNumbers={showNumbers}
            font={font}
          />
        </Canvas>
      </Animated.View>
    </GestureDetector>
  );
}

/**
 * RENDERING BOTTLENECKS IDENTIFIED:
 *
 * 1. PATH RE-RENDERING: Every pathVersion change creates new array via .map()
 *    which forces React to diff/reconcile all <Path> components even when only
 *    one path changed. MITIGATION: Using cached Skia paths reduces actual GPU work.
 *
 * 2. BLUR EFFECTS: BlurMask on path glow layers is GPU-intensive. Each blur
 *    requires multiple passes. For many paths, this can cause frame drops.
 *    MITIGATION: Use smaller blur radius, or disable glow on lower-end devices.
 *
 * 3. FILL PATH RECTS: addRect() for each cell creates many rectangles.
 *    For paths with 50+ cells, this adds up. MITIGATION: Could use a single
 *    filled polygon path instead, but current approach is acceptable.
 *
 * 4. RADIAL GRADIENT SHADER: TouchGlow's RadialGradient shader is recomputed
 *    each frame during drag. Runs on UI thread via Reanimated (good) but
 *    still adds GPU draw calls.
 *
 * 5. ENDPOINTS MAP IN RENDER: Creates new React elements each render.
 *    MITIGATION: Memoize endpoints rendering component.
 *
 * 6. CHANGE DETECTION: Only checks points.length, not actual positions.
 *    Could miss updates if path backtracks to same length.
 *
 * PERFORMANCE TIPS:
 * - Reduce blur radius on budget devices (cellSize / 8 instead of / 5)
 * - Consider using opacity instead of BlurMask for glow on low-end devices
 * - The current caching strategy is good for incremental path updates
 */

// Paths renderer - reads from ref, triggered by version change
// Uses incremental updates to only rebuild changed paths
const PathsRenderer = React.memo(function PathsRenderer({
  pathsRef,
  pathVersion,
  cellSize,
  halfCell,
  currentPathIdx,
}: {
  pathsRef: React.RefObject<PathRenderData[]>;
  pathVersion: number;
  cellSize: number;
  halfCell: number;
  currentPathIdx: number;
}) {
  // Cache for Skia paths - persists across renders
  const cacheRef = useRef<CachedSkiaPath[]>([]);

  // Build Skia paths incrementally - only rebuild changed paths
  const skiaPathsData = useMemo(() => {
    const startTime = performance.now();
    const paths = pathsRef.current;
    const cache = cacheRef.current;

    // Ensure cache has right size
    while (cache.length < paths.length) {
      cache.push({
        pathIndex: cache.length,
        strokePath: Skia.Path.Make(),
        fillPath: Skia.Path.Make(),
        color: '#ffffff',
        pointCount: 0,
        lastPointHash: '',
      });
    }

    // Update only the current path during drag (optimization)
    // Other paths only get updated when explicitly needed
    const indicesToCheck = currentPathIdx >= 0 ? [currentPathIdx] : [];

    // Also check any path that doesn't have cached data yet
    for (let i = 0; i < paths.length; i++) {
      if (cache[i].pointCount === 0 && paths[i].points.length > 0) {
        indicesToCheck.push(i);
      }
    }

    for (const i of indicesToCheck) {
      if (i >= paths.length) continue;
      const pathData = paths[i];
      const cached = cache[i];
      const { points, color } = pathData;

      // Compute hash of last point for backtrack detection
      const lastPt = points[points.length - 1];
      const lastPointHash = lastPt ? `${lastPt.x},${lastPt.y}` : '';

      // Check if this path changed (length, color, or last point position)
      const pathChanged = cached.pointCount !== points.length ||
                         cached.color !== color ||
                         cached.lastPointHash !== lastPointHash;

      if (pathChanged) {
        // Rebuild this path's Skia objects
        cached.strokePath.reset();
        cached.fillPath.reset();

        if (points.length > 0) {
          cached.strokePath.moveTo(points[0].x * cellSize + halfCell, points[0].y * cellSize + halfCell);
          for (let j = 1; j < points.length; j++) {
            cached.strokePath.lineTo(points[j].x * cellSize + halfCell, points[j].y * cellSize + halfCell);
          }
        }

        for (const pt of points) {
          cached.fillPath.addRect(Skia.XYWHRect(pt.x * cellSize, pt.y * cellSize, cellSize, cellSize));
        }

        cached.color = color;
        cached.pointCount = points.length;
        cached.lastPointHash = lastPointHash;
      }
    }

    // Return a new array reference to trigger re-render, but paths are cached
    const result = cache.slice(0, paths.length).map(c => ({
      pathIndex: c.pathIndex,
      strokePath: c.strokePath,
      fillPath: c.fillPath,
      color: c.color,
    }));

    const elapsed = performance.now() - startTime;
    if (elapsed > 2) {
      console.log(`[PERF] PathsRenderer useMemo took ${elapsed.toFixed(1)}ms`);
    }

    return result;
  }, [pathVersion, cellSize, halfCell, currentPathIdx]);

  return (
    <>
      {skiaPathsData.map((data) => {
        const isCurrentPath = data.pathIndex === currentPathIdx;
        return (
          <Group key={data.pathIndex}>
            {/* Cell fill - only for current active path */}
            {isCurrentPath && (
              <Path path={data.fillPath} color={`${data.color}15`} />
            )}

            {/* Path glow layer - only for current active path */}
            {isCurrentPath && (
              <Path
                path={data.strokePath}
                color={`${data.color}25`}
                style="stroke"
                strokeWidth={cellSize / 3.5}
                strokeCap="round"
                strokeJoin="round"
              >
                <BlurMask blur={cellSize / 10} style="normal" />
              </Path>
            )}

            {/* Main path stroke */}
            <Path
              path={data.strokePath}
              color={data.color}
              style="stroke"
              strokeWidth={cellSize / 4}
              strokeCap="round"
              strokeJoin="round"
            />
          </Group>
        );
      })}
    </>
  );
});

// Memoized endpoints renderer - prevents re-creating React elements on every render
const EndpointsRenderer = React.memo(function EndpointsRenderer({
  endpoints,
  cellSize,
  halfCell,
  showNumbers,
  font,
}: {
  endpoints: { x: number; y: number; pathIndex: number }[];
  cellSize: number;
  halfCell: number;
  showNumbers: boolean;
  font: ReturnType<typeof useFont>;
}) {
  return (
    <>
      {endpoints.map((ep) => (
        <Group key={`endpoint-${ep.x}-${ep.y}`}>
          {/* Endpoint circle */}
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
    </>
  );
});

// Fluid line with glow effect - smooth UI thread animation with glow
function FluidLineWithGlow({
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
    // Hide if not dragging, no valid last point, or touch is out of bounds
    if (!isDragging.value || lastPointX.value < 0 || lastPointY.value < 0 || preciseX.value < 0 || preciseY.value < 0) {
      return vec(-100, -100);
    }
    return vec(lastPointX.value * cellSize + halfCell, lastPointY.value * cellSize + halfCell);
  });

  const p2 = useDerivedValue(() => {
    if (!isDragging.value || preciseX.value < 0 || preciseY.value < 0 || lastPointX.value < 0 || lastPointY.value < 0) {
      return vec(-100, -100);
    }

    const lastCenterX = lastPointX.value * cellSize + halfCell;
    const lastCenterY = lastPointY.value * cellSize + halfCell;
    const mouseX = preciseX.value * cellSize;
    const mouseY = preciseY.value * cellSize;
    const deltaX = mouseX - lastCenterX;
    const deltaY = mouseY - lastCenterY;

    let targetX = lastCenterX;
    let targetY = lastCenterY;

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

  const glowColor = useDerivedValue(() => `${fluidColor.value}60`);

  return (
    <Group>
      {/* Glow layer - no blur for performance, opacity handles the glow effect */}
      <Line
        p1={p1}
        p2={p2}
        color={glowColor}
        style="stroke"
        strokeWidth={cellSize / 2.5}
        strokeCap="round"
      />
      {/* Main line */}
      <Line
        p1={p1}
        p2={p2}
        color={fluidColor}
        style="stroke"
        strokeWidth={cellSize / 4}
        strokeCap="round"
      />
    </Group>
  );
}

// Touch glow effect - circle that follows touch position
// Note: BlurMask removed for performance during drag - opacity provides sufficient glow effect
function TouchGlow({
  preciseX,
  preciseY,
  isDragging,
  fluidColor,
  cellSize,
}: {
  preciseX: SharedValue<number>;
  preciseY: SharedValue<number>;
  isDragging: SharedValue<boolean>;
  fluidColor: SharedValue<string>;
  cellSize: number;
}) {
  const glowRadius = cellSize * 1.2;

  const centerX = useDerivedValue(() => {
    if (!isDragging.value || preciseX.value < 0) return -1000;
    return preciseX.value * cellSize;
  });

  const centerY = useDerivedValue(() => {
    if (!isDragging.value || preciseY.value < 0) return -1000;
    return preciseY.value * cellSize;
  });

  const glowColor = useDerivedValue(() => {
    return `${fluidColor.value}40`; // Slightly higher opacity to compensate for no blur
  });

  return (
    <Circle cx={centerX} cy={centerY} r={glowRadius} color={glowColor} />
  );
}

// Cell highlight glow - highlights the cell currently being hovered
// Note: Outer BlurMask layer removed for performance - inner highlight provides sufficient feedback
function CellHighlightGlow({
  lastCellX,
  lastCellY,
  preciseX,
  preciseY,
  isDragging,
  fluidColor,
  cellSize,
}: {
  lastCellX: SharedValue<number>;
  lastCellY: SharedValue<number>;
  preciseX: SharedValue<number>;
  preciseY: SharedValue<number>;
  isDragging: SharedValue<boolean>;
  fluidColor: SharedValue<string>;
  cellSize: number;
}) {
  const highlightX = useDerivedValue(() => {
    // Hide if not dragging, invalid cell, or touch is out of bounds
    if (!isDragging.value || lastCellX.value < 0 || preciseX.value < 0 || preciseY.value < 0) return -1000;
    return lastCellX.value * cellSize;
  });

  const highlightY = useDerivedValue(() => {
    if (!isDragging.value || lastCellY.value < 0 || preciseX.value < 0 || preciseY.value < 0) return -1000;
    return lastCellY.value * cellSize;
  });

  const glowColor = useDerivedValue(() => {
    return `${fluidColor.value}25`; // Slightly higher opacity to compensate for no blur
  });

  return (
    <RoundedRect
      x={highlightX}
      y={highlightY}
      width={cellSize}
      height={cellSize}
      r={cellSize / 8}
      color={glowColor}
    />
  );
}

# ChromaPath Board Generation Requirements

## Overview

ChromaPath is a Numberlink/Flow Free style puzzle game where players connect colored endpoints by drawing paths. The board generator must create puzzles that are:
- Solvable
- Have exactly one unique solution
- Challenging and visually interesting

---

## Core Requirements

### 1. Cell Coverage (CRITICAL)

**Requirement:** The unique solution MUST use every single cell on the board.

- Every cell must be part of exactly one path
- No empty cells allowed in the solution
- No cell can be used by multiple paths

**Validation:**
- After generation, verify `filledCells === width * height`
- The sum of all path lengths must equal total board size

### 2. Unique Solution (CRITICAL)

**Requirement:** There must be exactly ONE way to solve the puzzle that fills all cells.

- No alternative routing between any endpoint pairs
- No subset of paths can be rearranged to create a different valid solution
- If any alternative solution exists that ALSO fills ALL cells, the board is invalid
- Solutions that do NOT use the full board are NOT valid solutions (they don't count as alternatives)
- The ONLY valid solution is one that fills every cell

**Validation:**
- For each pair of paths, temporarily remove them
- Check if any alternative routing exists that:
  - Connects the same endpoints
  - Fills all the cells those paths originally used
- If ANY alternative exists, reject the board

### 2.1 No Adjacent Endpoints (CRITICAL)

**Requirement:** The two endpoints of the same path CANNOT be orthogonally adjacent.

- Endpoints of the same color must have at least one cell between them
- Diagonal adjacency is allowed (corners touching is OK)
- This prevents trivial 2-cell paths and ensures meaningful puzzles

**Example (INVALID):**
```
A A    ← Both endpoints adjacent, path is trivial
```

**Example (VALID):**
```
A . A  ← Endpoints separated, requires actual path
```

**Validation:**
- For each path, check if the two endpoints share an edge
- If `|x1 - x2| + |y1 - y2| === 1`, the board is invalid

### 2.2 No Obvious Shortcuts (CRITICAL)

**Requirement:** Paths should not have endpoints that are trivially close compared to the path length.

- If Manhattan distance between endpoints is very small but the path is very long, players will try the short route first
- This creates frustrating "trick" puzzles where the obvious solution doesn't work
- Reject paths where: `pathLength > manhattanDistance * 3` AND `manhattanDistance <= 3`

**Example (INVALID):**
```
A . . . .
. . . . .
. . . . .
. . . . A   ← Endpoints are 6 apart, but if path is 20 cells, that's suspicious
```

**Validation:**
- For each path, calculate Manhattan distance between endpoints
- If path length is more than 3x the Manhattan distance AND Manhattan distance is ≤ 3, reject

### 3. Path Complexity - Twists and Turns

**Requirement:** Paths should have interesting shapes with multiple direction changes.

**Minimum Turn Requirements:**
| Board Size | Min Turns per Path (avg) |
|------------|--------------------------|
| 5x5        | 2                        |
| 7x7        | 3                        |
| 10x10      | 4                        |
| 15x15+     | 5                        |

**Definition of a Turn:**
A turn occurs when a path changes direction (horizontal to vertical or vice versa).

Example path with 3 turns:
```
S → → ↓
      ↓
  ← ← ↓
  ↓
  E
```
(Right, Down, Left, Down = 3 direction changes)

**Anti-patterns to avoid:**
- Long straight lines (max 40% of path length in one direction)
- Simple L-shapes or U-shapes for paths longer than 4 cells
- Paths that only go in 2 directions total

### 4. Path Distribution

**Requirement:** Paths should be reasonably distributed across the board.

- No single path should dominate (max 30% of total cells for boards > 5x5)
- **Minimum path length: 3 cells** (including endpoints) - REQUIRED
- **Maximum number of paths: 1.3 × min(width, height)** - REQUIRED
- Paths should cross/interweave conceptually (endpoints scattered, not clustered)

### 5. Path Validity (CRITICAL)

**Requirement:** Each path must form a valid line where cells connect properly.

- **Non-endpoint cells:** Must have exactly 2 adjacent cells from the same path
- **Endpoint cells:** Must have exactly 1 adjacent cell from the same path
- No cell can be adjacent to more than 2 cells from its own path
- This ensures paths form simple lines, not branching or clustered structures

### 6. Endpoint Placement

**Requirement:** Endpoints should be well-distributed.

- Endpoints should not all cluster in one area
- At least some endpoints should be on opposite sides/corners
- Avoid having all endpoints on the perimeter only

---

## Performance Requirements

| Board Size | Typical Time | Worst Case |
|------------|--------------|------------|
| 5x5        | 1-5ms        | 100ms      |
| 7x7        | 2-10ms       | 200ms      |
| 10x10      | 5-50ms       | 500ms      |
| 15x15      | 100ms-2s     | 5000ms     |

**Note:** The generator uses a Las Vegas algorithm with backtracking. Performance varies based on random path choices. Typical cases are fast; worst cases occur when the algorithm needs many retries to find a valid board configuration.

---

## Test Cases

### Must Pass

1. **Full Coverage Test**
   - Generate board
   - Verify every cell has a path assignment
   - Verify no cell is null/empty

2. **Unique Solution Test**
   - Generate board
   - Attempt to find ANY alternative solution
   - Must find zero alternatives

3. **Turn Count Test**
   - Generate board
   - Count direction changes in each path
   - Average must meet minimum for board size

4. **Path Length Test**
   - No path shorter than 3 cells
   - No single path > 30% of board (for boards > 25 cells)

5. **Solvability Test**
   - Given only endpoints, a solver must be able to find the unique solution

### Must Fail (Invalid Boards)

1. Board with empty cell → REJECT
2. Board where two paths could swap routes → REJECT
3. Board where a path is just a straight line across entire width/height → REJECT (for boards > 5x5)
4. Board where any path's endpoints are orthogonally adjacent → REJECT

---

## Algorithm Notes

### Current Approach: Incremental Path Building

1. Place paths one at a time, exploring valid routes
2. Each path must satisfy Path Validity requirements (Section 5)
3. Use backtracking when stuck
4. Validate for unique solution using pair-based checking
5. If validation fails or board can't be filled, regenerate

### Validation Algorithm

```
For each pair of paths (i, j):
    Remove paths i and j from board
    Find all possible routings between i's endpoints
    Find all possible routings between j's endpoints
    For each combination of new routings:
        If they don't overlap AND fill all freed cells:
            REJECT (alternative solution exists)

If no alternatives found for any pair:
    ACCEPT
```

---

## Future Considerations

- Difficulty scaling (more turns = harder)
- Hint system compatibility
- Undo/redo support
- Board serialization for sharing

---

## Changelog

- **v1.1** - Added requirement 2.1 (no adjacent endpoints), clarified unique solution requirement
- **v1.0** - Initial requirements document

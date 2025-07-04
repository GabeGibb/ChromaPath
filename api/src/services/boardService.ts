import { BoardGenerator } from "@chromapath/shared";

// Constants
const MIN_BOARD_SIZE = 5;
const MAX_BOARD_SIZE = 15;

// Board generation service - can be extended for database integration
export class BoardService {
  private boardGenerator: BoardGenerator;

  constructor() {
    this.boardGenerator = new BoardGenerator(null);
  }

  /**
   * Generate a new board of the specified size
   * @param size - The size of the board to generate
   * @returns Promise<Board> - The generated board
   */
  async generateBoard(size: number): Promise<any> {
    // Validate size
    if (size < MIN_BOARD_SIZE || size > MAX_BOARD_SIZE) {
      throw new Error(
        `Board size must be between ${MIN_BOARD_SIZE} and ${MAX_BOARD_SIZE}`
      );
    }

    try {
      const board = await this.boardGenerator.generateBoard(size);
      return board;
    } catch (error) {
      console.error(`Failed to generate board of size ${size}:`, error);
      throw new Error(`Failed to generate board of size ${size}`);
    }
  }

  /**
   * Get board size constraints
   * @returns Object with min and max board sizes
   */
  getBoardSizeConstraints() {
    return {
      minSize: MIN_BOARD_SIZE,
      maxSize: MAX_BOARD_SIZE,
    };
  }

  /**
   * Validate board size
   * @param size - The size to validate
   * @returns boolean - Whether the size is valid
   */
  isValidBoardSize(size: number): boolean {
    return size >= MIN_BOARD_SIZE && size <= MAX_BOARD_SIZE;
  }

  // TODO: Future methods for database integration
  // async getCachedBoard(size: number): Promise<Board | null> {
  //   // This will be implemented when you add database integration
  //   // Example implementation:
  //   // const cachedBoard = await db.query(
  //   //   'SELECT board_data FROM boards WHERE size = $1 AND used_count < 10 ORDER BY created_at ASC LIMIT 1',
  //   //   [size]
  //   // );
  //   // if (cachedBoard.rows.length > 0) {
  //   //   await db.query('UPDATE boards SET used_count = used_count + 1 WHERE id = $1', [cachedBoard.rows[0].id]);
  //   //   return cachedBoard.rows[0].board_data;
  //   // }
  //   return null;
  // }

  // async cacheBoard(size: number, board: Board): Promise<void> {
  //   // This will be implemented when you add database integration
  //   // Example implementation:
  //   // await db.query(
  //   //   'INSERT INTO boards (size, board_data) VALUES ($1, $2)',
  //   //   [size, JSON.stringify(board)]
  //   // );
  // }

  // async getBoardFromCache(size: number): Promise<Board | null> {
  //   // This will be implemented when you add database integration
  //   // First try to get from cache, if not available, generate new one
  //   // const cachedBoard = await this.getCachedBoard(size);
  //   // if (cachedBoard) {
  //   //   return cachedBoard;
  //   // }
  //   //
  //   // // Generate new board and cache it for future use
  //   // const newBoard = await this.generateBoard(size);
  //   // await this.cacheBoard(size, newBoard);
  //   // return newBoard;
  //   return null;
  // }

  // async replenishCache(size: number, count: number = 10): Promise<void> {
  //   // This will be implemented when you add database integration
  //   // Generate multiple boards and cache them
  //   // for (let i = 0; i < count; i++) {
  //   //   const board = await this.generateBoard(size);
  //   //   await this.cacheBoard(size, board);
  //   // }
  //   //
  //   // // Update cache stats
  //   // await db.query(
  //   //   'INSERT INTO cache_stats (size, available_count, last_replenished) VALUES ($1, $2, NOW()) ON CONFLICT (size) DO UPDATE SET available_count = available_count + $2, last_replenished = NOW()',
  //   //   [size, count]
  //   // );
  // }

  // async getCacheStats(): Promise<any> {
  //   // This will be implemented when you add database integration
  //   // return await db.query('SELECT * FROM cache_stats ORDER BY size');
  //   return [];
  // }
}

// Export singleton instance
export const boardService = new BoardService();

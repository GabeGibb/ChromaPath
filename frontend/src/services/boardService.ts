import { Board } from "@/shared/types";

export interface BoardResponse {
  board: Board;
  width: number;
  height: number;
  generatedAt: string;
}

export interface BoardError {
  error: string;
  message?: string;
}

export type LadderBoard = {
  board: Board;
  width: number;
  height: number;
  generatedAt: string;
};

export class BoardService {
  static async generateBoard(
    width: number,
    height: number
  ): Promise<BoardResponse> {
    const response = await fetch(`/api/puzzle?width=${width}&height=${height}`);

    if (!response.ok) {
      const errorData: BoardError = await response.json();
      throw new Error(
        errorData.message || `HTTP ${response.status}: ${errorData.error}`
      );
    }

    const data: BoardResponse = await response.json();

    if (!data.board) {
      throw new Error("Invalid board data received from server");
    }

    return data;
  }

  static async generateLadderBoards(): Promise<LadderBoard[]> {
    const response = await fetch(`/api/puzzle/ladder`);
    if (!response.ok) {
      const errorData: BoardError = await response.json();
      throw new Error(
        errorData.message || `HTTP ${response.status}: ${errorData.error}`
      );
    }
    const data = await response.json();
    if (!data.boards || !Array.isArray(data.boards)) {
      throw new Error("Invalid ladder board data received from server");
    }
    return data.boards;
  }
}

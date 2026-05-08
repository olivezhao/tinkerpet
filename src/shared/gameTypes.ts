export const GOMOKU_BOARD_SIZE = 15

export type GomokuStone = 0 | 1 | 2
export type GomokuSide = 1 | 2
export type GomokuDifficulty = "easy" | "normal" | "hard"
export type GomokuGameResult = "ongoing" | "player_win" | "tinker_win" | "draw"

export interface GomokuMove {
  side: GomokuSide
  x: number
  y: number
}

export interface GomokuGameState {
  board: GomokuStone[][]
  currentTurn: GomokuSide
  difficulty: GomokuDifficulty
  id: string
  moveCount: number
  moves: GomokuMove[]
  result: GomokuGameResult
  startedAt: number
  updatedAt: number
}

export interface GomokuHistoryItem {
  difficulty: GomokuDifficulty
  durationMs: number
  endedAt: number
  id: string
  result: "draw" | "lose" | "win"
  startedAt: number
  totalMoves: number
}

export function createEmptyBoard(size = GOMOKU_BOARD_SIZE): GomokuStone[][] {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => 0 as GomokuStone)
  )
}

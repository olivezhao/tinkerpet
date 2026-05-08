import { contextBridge, ipcRenderer } from "electron"
import type { GomokuDifficulty, GomokuGameState, GomokuHistoryItem } from "../shared/gameTypes"

const GAME_NEW_CHANNEL = "game:new"
const GAME_MOVE_CHANNEL = "game:move"
const GAME_AI_MOVE_CHANNEL = "game:ai-move"
const GAME_FINISH_CHANNEL = "game:finish"
const GAME_HISTORY_GET_CHANNEL = "game:history:get"
const GAME_DIFFICULTY_SET_CHANNEL = "game:difficulty:set"

contextBridge.exposeInMainWorld("tinkerpetGame", {
  createNewGame: (difficulty: GomokuDifficulty): Promise<GomokuGameState> =>
    ipcRenderer.invoke(GAME_NEW_CHANNEL, difficulty),
  makeMove: (gameState: GomokuGameState, x: number, y: number): Promise<GomokuGameState> =>
    ipcRenderer.invoke(GAME_MOVE_CHANNEL, gameState, x, y),
  requestAiMove: (gameState: GomokuGameState): Promise<GomokuGameState> =>
    ipcRenderer.invoke(GAME_AI_MOVE_CHANNEL, gameState),
  finishGame: (payload: {
    difficulty: GomokuDifficulty
    gameState: GomokuGameState
  }): Promise<{
    decorPoints?: number
    message?: string
    ok: boolean
    result?: "draw" | "lose" | "win"
    xp?: number
    xpDelta?: number
  }> =>
    ipcRenderer.invoke(GAME_FINISH_CHANNEL, payload),
  getHistory: (): Promise<GomokuHistoryItem[]> => ipcRenderer.invoke(GAME_HISTORY_GET_CHANNEL),
  setDifficulty: (difficulty: GomokuDifficulty): Promise<GomokuDifficulty> =>
    ipcRenderer.invoke(GAME_DIFFICULTY_SET_CHANNEL, difficulty)
})

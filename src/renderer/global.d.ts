import type {
  DailyReportSummary,
  DecorState,
  DebugSnapshot,
  PetEvent,
  PetProfile,
  SevenDayStats,
  ShareCardResult
} from "../shared/types"
import type {
  GomokuDifficulty,
  GomokuGameState,
  GomokuHistoryItem
} from "../shared/gameTypes"

declare global {
  interface Window {
    tinkerpet: {
      getDecorState: () => Promise<DecorState>
      getProfile: () => Promise<PetProfile>
      onDecorUpdated: (callback: (decorState: DecorState) => void) => () => void
      onPetEvent: (callback: (event: PetEvent) => void) => () => void
      onProfileUpdated: (callback: (profile: PetProfile) => void) => () => void
      version: string
    }
    tinkerpetDebug: {
      clearLocalData: () => Promise<DebugSnapshot>
      clearEventLog: () => Promise<DebugSnapshot>
      getDecorState: () => Promise<DecorState>
      getProfile: () => Promise<PetProfile>
      getSnapshot: () => Promise<DebugSnapshot>
      onDecorUpdated: (callback: (decorState: DecorState) => void) => () => void
      onProfileUpdated: (callback: (profile: PetProfile) => void) => () => void
      onSnapshotUpdated: (callback: (snapshot: DebugSnapshot) => void) => () => void
      sendDebugEvent: (event: PetEvent) => Promise<DebugSnapshot>
      openQuickPlay: () => Promise<boolean>
      updateDecorSelection: (slot: string, itemId: string) => Promise<DecorState>
      updatePetName: (petName: string) => Promise<PetProfile>
      updateProfilePersonality: (personality: string) => Promise<PetProfile>
      updateProfileSkin: (skinId: string) => Promise<PetProfile>
    }
    tinkerpetReport: {
      getDailyReport: () => Promise<DailyReportSummary>
      generateShareCard: () => Promise<ShareCardResult>
      revealShareCard: (filePath: string) => Promise<void>
    }
    tinkerpetDataPanel: {
      getSevenDayStats: () => Promise<SevenDayStats>
    }
    tinkerpetGame: {
      createNewGame: (difficulty: GomokuDifficulty) => Promise<GomokuGameState>
      finishGame: (payload: {
        difficulty: GomokuDifficulty
        gameState: GomokuGameState
      }) => Promise<{
        decorPoints?: number
        message?: string
        ok: boolean
        result?: "draw" | "lose" | "win"
        xp?: number
        xpDelta?: number
      }>
      getHistory: () => Promise<GomokuHistoryItem[]>
      makeMove: (gameState: GomokuGameState, x: number, y: number) => Promise<GomokuGameState>
      requestAiMove: (gameState: GomokuGameState) => Promise<GomokuGameState>
      setDifficulty: (difficulty: GomokuDifficulty) => Promise<GomokuDifficulty>
    }
  }
}

export {}

declare module "*.png" {
  const source: string
  export default source
}

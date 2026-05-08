import type {
  DailyReportSummary,
  DecorState,
  DebugSnapshot,
  PetEvent,
  PetProfile,
  SevenDayStats,
  ShareCardResult
} from "../shared/types"

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
  }
}

export {}

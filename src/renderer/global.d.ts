import type {
  DailyReportSummary,
  DebugSnapshot,
  PetEvent,
  PetProfile,
  ShareCardResult
} from "../shared/types"

declare global {
  interface Window {
    tinkerpet: {
      onPetEvent: (callback: (event: PetEvent) => void) => () => void
      version: string
    }
    tinkerpetDebug: {
      clearEventLog: () => Promise<DebugSnapshot>
      getProfile: () => Promise<PetProfile>
      getSnapshot: () => Promise<DebugSnapshot>
      onSnapshotUpdated: (callback: (snapshot: DebugSnapshot) => void) => () => void
      sendDebugEvent: (event: PetEvent) => Promise<DebugSnapshot>
      updatePetName: (petName: string) => Promise<PetProfile>
    }
    tinkerpetReport: {
      getDailyReport: () => Promise<DailyReportSummary>
      generateShareCard: () => Promise<ShareCardResult>
      revealShareCard: (filePath: string) => Promise<void>
    }
  }
}

export {}

import type { DebugSnapshot, PetEvent } from "../shared/types"

declare global {
  interface Window {
    tinkerpet: {
      onPetEvent: (callback: (event: PetEvent) => void) => () => void
      version: string
    }
    tinkerpetDebug: {
      clearEventLog: () => Promise<DebugSnapshot>
      getSnapshot: () => Promise<DebugSnapshot>
      onSnapshotUpdated: (callback: (snapshot: DebugSnapshot) => void) => () => void
      sendDebugEvent: (event: PetEvent) => Promise<DebugSnapshot>
    }
  }
}

export {}

export type PetState = "idle" | "waiting" | "finished" | "failed" | "sleeping"

export type EventProvider =
  | "chatgpt"
  | "claude"
  | "cursor"
  | "gemini"
  | "pet-run"
  | "vscode"

export type EventSourceType = "browser" | "cli" | "debug" | "ide"

export type EventMetadata = Record<string, boolean | number | string>

export type PetEventType =
  | "AI_TASK_FAILED"
  | "AI_TASK_FINISHED"
  | "AI_TASK_PROGRESS"
  | "AI_TASK_STARTED"
  | "WORKFLOW_TASK_FAILED"
  | "WORKFLOW_TASK_FINISHED"
  | "WORKFLOW_TASK_PROGRESS"
  | "WORKFLOW_TASK_STARTED"

export interface PetEvent {
  durationMs?: number
  endedAt?: number
  exitCode?: number
  metadata?: EventMetadata
  provider?: EventProvider
  reason?: string
  source: string
  sourceType?: EventSourceType
  startedAt?: number
  statusText?: string
  taskId?: string
  timestamp?: number
  title?: string
  type: PetEventType
}

export interface EventLogItem {
  event: PetEvent
  eventId: string
  receivedAt: number
  source: string
}

export interface DebugSnapshot {
  activeTaskCount: number
  dailyStats: DailyStats
  eventLog: EventLogItem[]
  profile: PetProfile
  sources: PublicSourceRecord[]
  state: PetState
}

export interface DailyReportSummary {
  activeTaskCount: number
  completedCount: number
  date: string
  failedCount: number
  generatedAt: number
  level: number
  petName: string
  startedCount: number
  summaryText: string
  topSource: string
  totalWaitMinutes: number
  totalXp: number
  todayXp: number
}

export interface ShareCardResult {
  fileName: string
  filePath: string
  generatedAt: number
}

export interface DailyStats {
  activeTasks: Record<string, DailyStatsActiveTask>
  completedCount: number
  date: string
  failedCount: number
  firstUseXpAwarded: boolean
  rewardedTaskKeys: string[]
  startedCount: number
  totalWaitMs: number
  xpEarned: number
}

export interface DailyStatsActiveTask {
  source: string
  startedAt: number
  title?: string
  type: PetEvent["type"]
}

export interface PetProfile {
  createdAt: number
  level: number
  petName: string
  updatedAt: number
  xp: number
}

export interface AppConfig {
  bridge: {
    port: number
    token: string
  }
  notification: {
    enabled: boolean
    sound: boolean
  }
  petName: string
  window: {
    alwaysOnTop: boolean
    height: number
    ignoreMouseEvents: boolean
    width: number
    x?: number
    y?: number
  }
}

export type SourceStatus = "connected" | "stale"

export interface SourceRecord {
  createdAt: number
  lastSeenAt: number
  name: string
  provider?: EventProvider
  sourceId: string
  sourceType: EventSourceType
  status: SourceStatus
  token: string
}

export type PublicSourceRecord = Omit<SourceRecord, "token">

export type EventBridgeErrorCode =
  | "INTERNAL_ERROR"
  | "INVALID_EVENT"
  | "INVALID_JSON"
  | "METHOD_NOT_ALLOWED"
  | "NOT_FOUND"
  | "PAYLOAD_TOO_LARGE"
  | "UNAUTHORIZED"

export interface EventBridgeErrorResponse {
  error: {
    code: EventBridgeErrorCode
    message: string
  }
  ok: false
}

export interface EventBridgeSuccessResponse {
  deduped?: false
  eventId: string
  ok: true
}

export interface EventBridgeDedupedResponse {
  deduped: true
  ok: true
}

export type EventBridgeResponse =
  | EventBridgeDedupedResponse
  | EventBridgeErrorResponse
  | EventBridgeSuccessResponse

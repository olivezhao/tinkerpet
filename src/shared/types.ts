export type PetState = "idle" | "waiting" | "finished" | "failed" | "sleeping"

export type PetEvent =
  | {
      type: "AI_TASK_STARTED"
      source: string
      title?: string
      timestamp?: number
    }
  | {
      type: "AI_TASK_FINISHED"
      source: string
      title?: string
      timestamp?: number
    }
  | {
      type: "AI_TASK_FAILED"
      source: string
      title?: string
      reason?: string
      timestamp?: number
    }
  | {
      type: "WORKFLOW_TASK_STARTED"
      source: string
      title?: string
      taskId?: string
      timestamp?: number
    }
  | {
      type: "WORKFLOW_TASK_FINISHED"
      source: string
      title?: string
      taskId?: string
      timestamp?: number
    }
  | {
      type: "WORKFLOW_TASK_FAILED"
      source: string
      title?: string
      taskId?: string
      reason?: string
      timestamp?: number
    }

export interface EventLogItem {
  event: PetEvent
  eventId: string
  receivedAt: number
  source: string
}

export interface DebugSnapshot {
  activeTaskCount: number
  eventLog: EventLogItem[]
  state: PetState
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
  eventId: string
  ok: true
}

export type EventBridgeResponse =
  | EventBridgeErrorResponse
  | EventBridgeSuccessResponse

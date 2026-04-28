import type {
  EventMetadata,
  EventProvider,
  EventSourceType,
  PetEvent,
  PetEventType
} from "../../shared/types"

const MAX_TITLE_LENGTH = 120

const VALID_EVENT_TYPES = new Set<PetEventType>([
  "AI_TASK_FAILED",
  "AI_TASK_FINISHED",
  "AI_TASK_PROGRESS",
  "AI_TASK_STARTED",
  "WORKFLOW_TASK_FAILED",
  "WORKFLOW_TASK_FINISHED",
  "WORKFLOW_TASK_PROGRESS",
  "WORKFLOW_TASK_STARTED"
])

const VALID_PROVIDERS = new Set<EventProvider>([
  "chatgpt",
  "claude",
  "cursor",
  "gemini",
  "pet-run",
  "vscode"
])

const VALID_SOURCE_TYPES = new Set<EventSourceType>([
  "browser",
  "cli",
  "debug",
  "ide"
])

interface ValidationResult {
  event?: PetEvent
  message?: string
  ok: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string"
}

function isOptionalNumber(value: unknown): value is number | undefined {
  return value === undefined || typeof value === "number"
}

function isOptionalMetadata(value: unknown): value is EventMetadata | undefined {
  if (value === undefined) {
    return true
  }

  if (!isRecord(value)) {
    return false
  }

  return Object.values(value).every(
    (item) =>
      typeof item === "boolean" ||
      typeof item === "number" ||
      typeof item === "string"
  )
}

export function validatePetEvent(value: unknown): ValidationResult {
  if (!isRecord(value)) {
    return {
      message: "Event payload must be an object",
      ok: false
    }
  }

  if (typeof value.type !== "string") {
    return {
      message: "Event type is required",
      ok: false
    }
  }

  if (!VALID_EVENT_TYPES.has(value.type as PetEventType)) {
    return {
      message: `Unsupported event type: ${value.type}`,
      ok: false
    }
  }

  if (typeof value.source !== "string" || value.source.length === 0) {
    return {
      message: "Event source is required",
      ok: false
    }
  }

  if (
    !isOptionalString(value.title) ||
    !isOptionalString(value.reason) ||
    !isOptionalString(value.taskId) ||
    !isOptionalString(value.statusText)
  ) {
    return {
      message: "Optional text fields must be strings",
      ok: false
    }
  }

  if (typeof value.title === "string" && value.title.length > MAX_TITLE_LENGTH) {
    return {
      message: `Title must be ${MAX_TITLE_LENGTH} characters or fewer`,
      ok: false
    }
  }

  if (
    value.sourceType !== undefined &&
    (typeof value.sourceType !== "string" ||
      !VALID_SOURCE_TYPES.has(value.sourceType as EventSourceType))
  ) {
    return {
      message: `Unsupported sourceType: ${String(value.sourceType)}`,
      ok: false
    }
  }

  if (
    value.provider !== undefined &&
    (typeof value.provider !== "string" ||
      !VALID_PROVIDERS.has(value.provider as EventProvider))
  ) {
    return {
      message: `Unsupported provider: ${String(value.provider)}`,
      ok: false
    }
  }

  if (
    !isOptionalNumber(value.durationMs) ||
    !isOptionalNumber(value.endedAt) ||
    !isOptionalNumber(value.exitCode) ||
    !isOptionalNumber(value.startedAt) ||
    !isOptionalNumber(value.timestamp)
  ) {
    return {
      message: "Optional numeric fields must be numbers",
      ok: false
    }
  }

  if (!isOptionalMetadata(value.metadata)) {
    return {
      message: "Metadata values must be strings, numbers, or booleans",
      ok: false
    }
  }

  return {
    event: value as unknown as PetEvent,
    ok: true
  }
}

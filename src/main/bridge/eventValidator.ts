import type { PetEvent } from "../../shared/types"

const VALID_EVENT_TYPES = new Set<PetEvent["type"]>([
  "AI_TASK_FAILED",
  "AI_TASK_FINISHED",
  "AI_TASK_STARTED",
  "WORKFLOW_TASK_FAILED",
  "WORKFLOW_TASK_FINISHED",
  "WORKFLOW_TASK_STARTED"
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

  if (!VALID_EVENT_TYPES.has(value.type as PetEvent["type"])) {
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
    !isOptionalString(value.taskId)
  ) {
    return {
      message: "Optional text fields must be strings",
      ok: false
    }
  }

  if (!isOptionalNumber(value.timestamp)) {
    return {
      message: "Timestamp must be a number",
      ok: false
    }
  }

  return {
    event: value as PetEvent,
    ok: true
  }
}

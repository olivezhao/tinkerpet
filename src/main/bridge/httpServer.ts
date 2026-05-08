import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http"
import type {
  EventBridgeErrorCode,
  EventBridgeResponse,
  EventProvider,
  EventSourceType
} from "../../shared/types"
import {
  broadcastBridgeSnapshot,
  dispatchBridgeEvent,
  type EventDispatcherOptions
} from "./eventDispatcher"
import { validatePetEvent } from "./eventValidator"
import {
  heartbeatSource,
  isSourceTokenValid,
  loadSources,
  registerSource,
  SOURCE_HEARTBEAT_TIMEOUT_MS,
  toPublicSource
} from "../store/sourceStore"

const BRIDGE_HOST = "127.0.0.1"
const BRIDGE_MAX_PAYLOAD_BYTES = 12 * 1024
export const BRIDGE_PORT = 17321

interface HttpEventBridgeOptions extends EventDispatcherOptions {
  getBridgeToken: () => string
  getBridgePort: () => number
}

function sendJson(
  response: ServerResponse,
  statusCode: number,
  body: EventBridgeResponse | Record<string, unknown>
): void {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8"
  })
  response.end(JSON.stringify(body))
}

function sendError(
  response: ServerResponse,
  statusCode: number,
  code: EventBridgeErrorCode,
  message: string
): void {
  sendJson(response, statusCode, {
    error: {
      code,
      message
    },
    ok: false
  })
}

function isAuthorized(
  request: IncomingMessage,
  options: HttpEventBridgeOptions
): boolean {
  const authorization = request.headers.authorization

  if (authorization === `Bearer ${options.getBridgeToken()}`) {
    return true
  }

  if (!authorization?.startsWith("Bearer ")) {
    return false
  }

  return isSourceTokenValid(authorization.slice("Bearer ".length))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function parseUrlPath(request: IncomingMessage): string {
  return new URL(request.url ?? "/", "http://127.0.0.1").pathname
}

function readRequestBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ""
    let receivedBytes = 0
    let payloadTooLarge = false

    request.setEncoding("utf8")

    request.on("data", (chunk: string) => {
      receivedBytes += Buffer.byteLength(chunk)

      if (receivedBytes > BRIDGE_MAX_PAYLOAD_BYTES) {
        payloadTooLarge = true
        return
      }

      body += chunk
    })

    request.on("end", () => {
      if (payloadTooLarge) {
        reject(new Error("PAYLOAD_TOO_LARGE"))
        return
      }

      resolve(body)
    })

    request.on("error", reject)
  })
}

async function handleEventsRequest(
  options: HttpEventBridgeOptions,
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  if (!isAuthorized(request, options)) {
    sendError(response, 401, "UNAUTHORIZED", "Missing or invalid bearer token")
    return
  }

  let rawBody: string

  try {
    rawBody = await readRequestBody(request)
  } catch (error) {
    if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") {
      sendError(response, 413, "PAYLOAD_TOO_LARGE", "Payload exceeds 12KB limit")
      return
    }

    sendError(response, 500, "INTERNAL_ERROR", "Failed to read request body")
    return
  }

  let parsedBody: unknown

  try {
    parsedBody = JSON.parse(rawBody)
  } catch {
    sendError(response, 400, "INVALID_JSON", "Request body must be valid JSON")
    return
  }

  const validation = validatePetEvent(parsedBody)

  if (!validation.ok || !validation.event) {
    sendError(
      response,
      400,
      "INVALID_EVENT",
      validation.message ?? "Invalid event payload"
    )
    return
  }

  const dispatchResult = dispatchBridgeEvent(options, validation.event)

  if (dispatchResult.deduped) {
    sendJson(response, 200, {
      deduped: true,
      ok: true
    })
    return
  }

  sendJson(response, 200, {
    deduped: false,
    eventId: dispatchResult.eventId ?? "",
    ok: true
  })
}

function handleHealthRequest(
  options: HttpEventBridgeOptions,
  response: ServerResponse
): void {
  sendJson(response, 200, {
    app: "TinkerPet",
    bridgePort: options.getBridgePort(),
    heartbeatTimeoutMs: SOURCE_HEARTBEAT_TIMEOUT_MS,
    ok: true,
    sources: loadSources().map(toPublicSource),
    status: "ok",
    version: "0.2"
  })
}

async function readJsonBody(
  request: IncomingMessage,
  response: ServerResponse
): Promise<Record<string, unknown> | null> {
  let rawBody: string

  try {
    rawBody = await readRequestBody(request)
  } catch (error) {
    if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") {
      sendError(response, 413, "PAYLOAD_TOO_LARGE", "Payload exceeds 12KB limit")
      return null
    }

    sendError(response, 500, "INTERNAL_ERROR", "Failed to read request body")
    return null
  }

  try {
    const parsedBody = JSON.parse(rawBody)

    if (!isRecord(parsedBody)) {
      sendError(response, 400, "INVALID_JSON", "Request body must be an object")
      return null
    }

    return parsedBody
  } catch {
    sendError(response, 400, "INVALID_JSON", "Request body must be valid JSON")
    return null
  }
}

function isSourceType(value: unknown): value is EventSourceType {
  return (
    value === "browser" ||
    value === "cli" ||
    value === "debug" ||
    value === "ide"
  )
}

function isProvider(value: unknown): value is EventProvider | undefined {
  return (
    value === undefined ||
    value === "chatgpt" ||
    value === "claude" ||
    value === "cursor" ||
    value === "deepseek" ||
    value === "gemini" ||
    value === "pet-run" ||
    value === "vscode"
  )
}

function canPublicRegisterSource(body: Record<string, unknown>): boolean {
  return (
    body.sourceType === "browser" &&
    (body.provider === "chatgpt" ||
      body.provider === "claude" ||
      body.provider === "deepseek" ||
      body.provider === "gemini")
  )
}

async function handleRegisterSourceRequest(
  options: HttpEventBridgeOptions,
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  const body = await readJsonBody(request, response)

  if (!body) {
    return
  }

  if (!isAuthorized(request, options) && !canPublicRegisterSource(body)) {
    sendError(response, 401, "UNAUTHORIZED", "Missing or invalid bearer token")
    return
  }

  if (typeof body.name !== "string" || body.name.trim().length === 0) {
    sendError(response, 400, "INVALID_EVENT", "Source name is required")
    return
  }

  if (!isSourceType(body.sourceType)) {
    sendError(response, 400, "INVALID_EVENT", "Unsupported sourceType")
    return
  }

  if (!isProvider(body.provider)) {
    sendError(response, 400, "INVALID_EVENT", "Unsupported provider")
    return
  }

  const source = registerSource({
    name: body.name.trim().slice(0, 80),
    provider: body.provider,
    sourceType: body.sourceType
  })
  broadcastBridgeSnapshot(options)

  sendJson(response, 200, {
    ok: true,
    source
  })
}

async function handleHeartbeatSourceRequest(
  options: HttpEventBridgeOptions,
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  const body = await readJsonBody(request, response)

  if (!body) {
    return
  }

  if (typeof body.sourceId !== "string" || typeof body.token !== "string") {
    sendError(response, 400, "INVALID_EVENT", "sourceId and token are required")
    return
  }

  try {
    const source = heartbeatSource({
      sourceId: body.sourceId,
      token: body.token
    })
    broadcastBridgeSnapshot(options)
    sendJson(response, 200, {
      ok: true,
      source
    })
  } catch {
    sendError(response, 401, "UNAUTHORIZED", "Missing or invalid source token")
  }
}

export function createHttpEventBridge(options: HttpEventBridgeOptions): Server {
  return createServer((request, response) => {
    const path = parseUrlPath(request)

    if (path === "/health") {
      if (request.method !== "GET") {
        sendError(response, 405, "METHOD_NOT_ALLOWED", "Only GET is supported")
        return
      }

      handleHealthRequest(options, response)
      return
    }

    if (path === "/sources/register") {
      if (request.method !== "POST") {
        sendError(response, 405, "METHOD_NOT_ALLOWED", "Only POST is supported")
        return
      }

      void handleRegisterSourceRequest(options, request, response)
      return
    }

    if (path === "/sources/heartbeat") {
      if (request.method !== "POST") {
        sendError(response, 405, "METHOD_NOT_ALLOWED", "Only POST is supported")
        return
      }

      void handleHeartbeatSourceRequest(options, request, response)
      return
    }

    if (path !== "/events") {
      sendError(response, 404, "NOT_FOUND", "Endpoint not found")
      return
    }

    if (request.method !== "POST") {
      sendError(response, 405, "METHOD_NOT_ALLOWED", "Only POST is supported")
      return
    }

    void handleEventsRequest(options, request, response)
  })
}

export function startHttpEventBridge(options: HttpEventBridgeOptions): Server {
  const server = createHttpEventBridge(options)
  const port = options.getBridgePort()

  server.listen(port, BRIDGE_HOST, () => {
    console.info(
      `TinkerPet local event bridge listening at http://${BRIDGE_HOST}:${port}`
    )
  })

  server.on("error", (error) => {
    console.error("TinkerPet local event bridge failed:", error)
  })

  return server
}

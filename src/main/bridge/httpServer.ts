import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http"
import type { EventBridgeErrorCode, EventBridgeResponse } from "../../shared/types"
import { dispatchBridgeEvent, type EventDispatcherOptions } from "./eventDispatcher"
import { validatePetEvent } from "./eventValidator"

const BRIDGE_HOST = "127.0.0.1"
const BRIDGE_MAX_PAYLOAD_BYTES = 8 * 1024
export const BRIDGE_PORT = 17321

interface HttpEventBridgeOptions extends EventDispatcherOptions {
  getBridgeToken: () => string
  getBridgePort: () => number
}

function sendJson(
  response: ServerResponse,
  statusCode: number,
  body: EventBridgeResponse
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
  return request.headers.authorization === `Bearer ${options.getBridgeToken()}`
}

function readRequestBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ""
    let receivedBytes = 0

    request.setEncoding("utf8")

    request.on("data", (chunk: string) => {
      receivedBytes += Buffer.byteLength(chunk)

      if (receivedBytes > BRIDGE_MAX_PAYLOAD_BYTES) {
        reject(new Error("PAYLOAD_TOO_LARGE"))
        request.destroy()
        return
      }

      body += chunk
    })

    request.on("end", () => {
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
      sendError(response, 413, "PAYLOAD_TOO_LARGE", "Payload exceeds 8KB limit")
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

  const eventId = dispatchBridgeEvent(options, validation.event)

  sendJson(response, 200, {
    eventId,
    ok: true
  })
}

export function createHttpEventBridge(options: HttpEventBridgeOptions): Server {
  return createServer((request, response) => {
    if (request.url !== "/events") {
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

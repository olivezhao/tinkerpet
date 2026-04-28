#!/usr/bin/env node

import { spawn } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import { randomBytes } from "node:crypto"

const DEFAULT_BRIDGE_PORT = 17321
const MAX_TITLE_LENGTH = 120
const REQUEST_TIMEOUT_MS = 250

function printUsage() {
  console.error("Usage: pet-run -- <command> [...args]")
}

function parseCommand(argv) {
  const separatorIndex = argv.indexOf("--")

  if (separatorIndex === -1) {
    return argv
  }

  return argv.slice(separatorIndex + 1)
}

function getCommandTitle(commandParts) {
  const title = commandParts.join(" ").trim()

  if (title.length <= MAX_TITLE_LENGTH) {
    return title
  }

  return `${title.slice(0, MAX_TITLE_LENGTH - 3)}...`
}

function getConfigPath() {
  return join(
    homedir(),
    "Library",
    "Application Support",
    "tinkerpet",
    "tinkerpet-config.json"
  )
}

function loadBridgeConfig() {
  const configPath = getConfigPath()

  if (!existsSync(configPath)) {
    return {
      port: DEFAULT_BRIDGE_PORT,
      token: null
    }
  }

  try {
    const config = JSON.parse(readFileSync(configPath, "utf8"))
    const port =
      Number.isInteger(config?.bridge?.port) && config.bridge.port > 0
        ? config.bridge.port
        : DEFAULT_BRIDGE_PORT
    const token =
      typeof config?.bridge?.token === "string" ? config.bridge.token : null

    return {
      port,
      token
    }
  } catch {
    return {
      port: DEFAULT_BRIDGE_PORT,
      token: null
    }
  }
}

async function postBridge(path, payload, options = {}) {
  const bridge = loadBridgeConfig()

  if (options.requiresAppToken !== false && !bridge.token) {
    return null
  }

  try {
    const response = await fetch(`http://127.0.0.1:${bridge.port}${path}`, {
      body: JSON.stringify(payload),
      headers: {
        ...(options.requiresAppToken === false
          ? {}
          : { Authorization: `Bearer ${bridge.token}` }),
        "Content-Type": "application/json"
      },
      method: "POST",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch {
    // TinkerPet is optional: command execution must not depend on the desktop app.
    return null
  }
}

async function registerPetRunSource() {
  const response = await postBridge("/sources/register", {
    name: "pet-run",
    provider: "pet-run",
    sourceType: "cli"
  })

  return response?.source ?? null
}

async function heartbeatPetRunSource(source) {
  if (
    !source ||
    typeof source.sourceId !== "string" ||
    typeof source.token !== "string"
  ) {
    return
  }

  await postBridge(
    "/sources/heartbeat",
    {
      sourceId: source.sourceId,
      token: source.token
    },
    {
      requiresAppToken: false
    }
  )
}

async function postEvent(event) {
  await postBridge("/events", event)
}

function runCommand(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: "inherit"
    })

    child.on("error", (error) => {
      console.error(`pet-run: failed to start command: ${error.message}`)
      resolve({
        code: 127,
        error
      })
    })

    child.on("close", (code, signal) => {
      resolve({
        code: typeof code === "number" ? code : 1,
        signal
      })
    })
  })
}

async function main() {
  const commandParts = parseCommand(process.argv.slice(2))

  if (commandParts.length === 0) {
    printUsage()
    process.exit(1)
  }

  const [command, ...args] = commandParts
  const taskId = `pet-run-${Date.now()}-${randomBytes(4).toString("hex")}`
  const title = getCommandTitle(commandParts)
  const startedAt = Date.now()
  const baseEvent = {
    metadata: {
      command: command,
      runner: "pet-run"
    },
    provider: "pet-run",
    source: "pet-run",
    sourceType: "cli",
    taskId,
    title
  }
  const source = await registerPetRunSource()

  if (source) {
    await postEvent({
      ...baseEvent,
      startedAt,
      timestamp: startedAt,
      type: "WORKFLOW_TASK_STARTED"
    })
  }

  const result = await runCommand(command, args)
  const endedAt = Date.now()
  const exitCode = result.code
  const success = exitCode === 0

  if (source) {
    await postEvent({
      ...baseEvent,
      durationMs: endedAt - startedAt,
      endedAt,
      exitCode,
      reason:
        success ? undefined : result.error?.message ?? result.signal ?? "Command failed",
      startedAt,
      timestamp: endedAt,
      type: success ? "WORKFLOW_TASK_FINISHED" : "WORKFLOW_TASK_FAILED"
    })
    await heartbeatPetRunSource(source)
  }

  process.exit(exitCode)
}

void main()

import { app } from "electron"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { randomBytes } from "node:crypto"
import type { AppConfig } from "../../shared/types"

const CONFIG_FILE_NAME = "tinkerpet-config.json"
const DEFAULT_WINDOW_SIZE = 220
const DEFAULT_BRIDGE_PORT = 17321

let cachedConfig: AppConfig | null = null

function getConfigPath(): string {
  return join(app.getPath("userData"), CONFIG_FILE_NAME)
}

function createToken(): string {
  return randomBytes(24).toString("hex")
}

function getDefaultConfig(): AppConfig {
  return {
    bridge: {
      port: DEFAULT_BRIDGE_PORT,
      token: createToken()
    },
    notification: {
      enabled: false,
      sound: false
    },
    petName: "TinkerPet",
    window: {
      alwaysOnTop: true,
      height: DEFAULT_WINDOW_SIZE,
      ignoreMouseEvents: false,
      width: DEFAULT_WINDOW_SIZE
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function mergeConfig(value: unknown): AppConfig {
  const defaults = getDefaultConfig()

  if (!isRecord(value)) {
    return defaults
  }

  const bridge = isRecord(value.bridge) ? value.bridge : {}
  const notification = isRecord(value.notification) ? value.notification : {}
  const windowConfig = isRecord(value.window) ? value.window : {}

  return {
    bridge: {
      port:
        typeof bridge.port === "number" && Number.isInteger(bridge.port)
          ? bridge.port
          : defaults.bridge.port,
      token: typeof bridge.token === "string" ? bridge.token : defaults.bridge.token
    },
    notification: {
      enabled:
        typeof notification.enabled === "boolean"
          ? notification.enabled
          : defaults.notification.enabled,
      sound:
        typeof notification.sound === "boolean"
          ? notification.sound
          : defaults.notification.sound
    },
    petName: typeof value.petName === "string" ? value.petName : defaults.petName,
    window: {
      alwaysOnTop:
        typeof windowConfig.alwaysOnTop === "boolean"
          ? windowConfig.alwaysOnTop
          : defaults.window.alwaysOnTop,
      height:
        typeof windowConfig.height === "number"
          ? windowConfig.height
          : defaults.window.height,
      ignoreMouseEvents:
        typeof windowConfig.ignoreMouseEvents === "boolean"
          ? windowConfig.ignoreMouseEvents
          : defaults.window.ignoreMouseEvents,
      width:
        typeof windowConfig.width === "number"
          ? windowConfig.width
          : defaults.window.width,
      x: typeof windowConfig.x === "number" ? windowConfig.x : undefined,
      y: typeof windowConfig.y === "number" ? windowConfig.y : undefined
    }
  }
}

function writeConfig(config: AppConfig): void {
  const configPath = getConfigPath()
  mkdirSync(dirname(configPath), { recursive: true })
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8")
}

export function loadConfig(): AppConfig {
  if (cachedConfig) {
    return cachedConfig
  }

  const configPath = getConfigPath()

  if (!existsSync(configPath)) {
    cachedConfig = getDefaultConfig()
    writeConfig(cachedConfig)
    return cachedConfig
  }

  try {
    cachedConfig = mergeConfig(JSON.parse(readFileSync(configPath, "utf8")))
  } catch {
    cachedConfig = getDefaultConfig()
  }

  writeConfig(cachedConfig)
  return cachedConfig
}

export function saveConfig(nextConfig: AppConfig): AppConfig {
  cachedConfig = nextConfig
  writeConfig(cachedConfig)
  return cachedConfig
}

export function updateConfig(updater: (current: AppConfig) => AppConfig): AppConfig {
  return saveConfig(updater(loadConfig()))
}

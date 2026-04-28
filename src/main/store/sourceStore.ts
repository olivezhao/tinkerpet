import { app } from "electron"
import { randomBytes } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import type {
  EventProvider,
  EventSourceType,
  PublicSourceRecord,
  SourceRecord
} from "../../shared/types"

const SOURCE_STORE_FILE_NAME = "tinkerpet-sources.json"
const STALE_AFTER_MS = 60 * 1000

let cachedSources: SourceRecord[] | null = null

export interface RegisterSourceInput {
  name: string
  provider?: EventProvider
  sourceType: EventSourceType
}

export interface HeartbeatSourceInput {
  sourceId: string
  token: string
}

function getSourceStorePath(): string {
  return join(app.getPath("userData"), SOURCE_STORE_FILE_NAME)
}

function createSourceId(): string {
  return `src_${randomBytes(8).toString("hex")}`
}

function createSourceToken(): string {
  return randomBytes(24).toString("hex")
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isSourceRecord(value: unknown): value is SourceRecord {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.createdAt === "number" &&
    typeof value.lastSeenAt === "number" &&
    typeof value.name === "string" &&
    typeof value.sourceId === "string" &&
    typeof value.sourceType === "string" &&
    typeof value.status === "string" &&
    typeof value.token === "string" &&
    (value.provider === undefined || typeof value.provider === "string")
  )
}

function withStatus(source: SourceRecord, now = Date.now()): SourceRecord {
  return {
    ...source,
    status: now - source.lastSeenAt > STALE_AFTER_MS ? "stale" : "connected"
  }
}

function writeSources(sources: SourceRecord[]): void {
  const sourceStorePath = getSourceStorePath()
  mkdirSync(dirname(sourceStorePath), { recursive: true })
  writeFileSync(sourceStorePath, `${JSON.stringify(sources, null, 2)}\n`, "utf8")
}

export function toPublicSource(source: SourceRecord): PublicSourceRecord {
  return {
    createdAt: source.createdAt,
    lastSeenAt: source.lastSeenAt,
    name: source.name,
    provider: source.provider,
    sourceId: source.sourceId,
    sourceType: source.sourceType,
    status: source.status
  }
}

export function loadSources(): SourceRecord[] {
  if (cachedSources) {
    return cachedSources.map((source) => withStatus(source))
  }

  const sourceStorePath = getSourceStorePath()

  if (!existsSync(sourceStorePath)) {
    cachedSources = []
    writeSources(cachedSources)
    return cachedSources
  }

  try {
    const parsed = JSON.parse(readFileSync(sourceStorePath, "utf8"))
    cachedSources = Array.isArray(parsed) ? parsed.filter(isSourceRecord) : []
  } catch {
    cachedSources = []
  }

  cachedSources = cachedSources.map((source) => withStatus(source))
  writeSources(cachedSources)
  return cachedSources
}

export function registerSource(input: RegisterSourceInput): SourceRecord {
  const now = Date.now()
  const sources = loadSources()
  const existingSource = sources.find(
    (source) =>
      source.name === input.name &&
      source.sourceType === input.sourceType &&
      source.provider === input.provider
  )

  if (existingSource) {
    const nextSource = withStatus({
      ...existingSource,
      lastSeenAt: now
    })
    cachedSources = sources.map((source) =>
      source.sourceId === nextSource.sourceId ? nextSource : source
    )
    writeSources(cachedSources)
    return nextSource
  }

  const nextSource: SourceRecord = {
    createdAt: now,
    lastSeenAt: now,
    name: input.name,
    provider: input.provider,
    sourceId: createSourceId(),
    sourceType: input.sourceType,
    status: "connected",
    token: createSourceToken()
  }

  cachedSources = [nextSource, ...sources]
  writeSources(cachedSources)
  return nextSource
}

export function heartbeatSource(input: HeartbeatSourceInput): SourceRecord {
  const sources = loadSources()
  const source = sources.find((item) => item.sourceId === input.sourceId)

  if (!source || source.token !== input.token) {
    throw new Error("SOURCE_NOT_FOUND")
  }

  const nextSource = withStatus({
    ...source,
    lastSeenAt: Date.now()
  })

  cachedSources = sources.map((item) =>
    item.sourceId === nextSource.sourceId ? nextSource : item
  )
  writeSources(cachedSources)
  return nextSource
}

export function isSourceTokenValid(token: string): boolean {
  return loadSources().some((source) => source.token === token)
}

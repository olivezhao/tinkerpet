import type { DailyStats, PetEvent } from "../../shared/types"
import { loadTodayStats, saveTodayStats } from "../store/dailyStatsStore"
import { addDecorPoints } from "../store/decorStore"
import { addProfileXp, loadProfile } from "../store/profileStore"

const FIRST_USE_XP = 3
const FINISHED_XP = 5
const FAILED_XP = 2
const FIRST_USE_DECOR_POINTS = 1
const FINISHED_DECOR_POINTS = 1

interface GrowthResult {
  decorPointsDelta: number
  dailyStats: DailyStats
  xpDelta: number
}

function isDebugEvent(event: PetEvent): boolean {
  return event.source.toLowerCase().includes("debug")
}

function getTaskKey(event: PetEvent): string {
  if ("taskId" in event && event.taskId) {
    return `${event.source}:${event.taskId}`
  }

  return `${event.source}:${event.title ?? event.type}`
}

function isStartedEvent(event: PetEvent): boolean {
  return event.type.endsWith("_STARTED")
}

function isFinishedEvent(event: PetEvent): boolean {
  return event.type.endsWith("_FINISHED")
}

function isFailedEvent(event: PetEvent): boolean {
  return event.type.endsWith("_FAILED")
}

export function applyGrowthForEvent(event: PetEvent): GrowthResult {
  const currentStats = loadTodayStats()

  if (isDebugEvent(event)) {
    return {
      decorPointsDelta: 0,
      dailyStats: currentStats,
      xpDelta: 0
    }
  }

  const taskKey = getTaskKey(event)
  let nextStats: DailyStats = {
    ...currentStats,
    activeTasks: { ...currentStats.activeTasks },
    rewardedTaskKeys: [...currentStats.rewardedTaskKeys]
  }
  let xpDelta = 0
  let decorPointsDelta = 0

  if (!nextStats.firstUseXpAwarded) {
    xpDelta += FIRST_USE_XP
    decorPointsDelta += FIRST_USE_DECOR_POINTS
    nextStats = {
      ...nextStats,
      firstUseXpAwarded: true
    }
  }

  if (isStartedEvent(event)) {
    nextStats = {
      ...nextStats,
      activeTasks: {
        ...nextStats.activeTasks,
        [taskKey]: {
          source: event.source,
          startedAt: event.timestamp ?? Date.now(),
          title: event.title,
          type: event.type
        }
      },
      startedCount: nextStats.startedCount + 1
    }
  }

  if (
    (isFinishedEvent(event) || isFailedEvent(event)) &&
    !nextStats.rewardedTaskKeys.includes(taskKey)
  ) {
    const activeTask = nextStats.activeTasks[taskKey]
    const endedAt = event.timestamp ?? Date.now()

    if (activeTask) {
      nextStats.totalWaitMs += Math.max(0, endedAt - activeTask.startedAt)
      delete nextStats.activeTasks[taskKey]
    }

    nextStats.rewardedTaskKeys.push(taskKey)

    if (isFinishedEvent(event)) {
      xpDelta += FINISHED_XP
      decorPointsDelta += FINISHED_DECOR_POINTS
      nextStats.completedCount += 1
    } else {
      xpDelta += FAILED_XP
      nextStats.failedCount += 1
    }
  }

  if (xpDelta > 0) {
    addProfileXp(xpDelta)
    nextStats = {
      ...nextStats,
      xpEarned: nextStats.xpEarned + xpDelta
    }
  } else {
    loadProfile()
  }

  if (decorPointsDelta > 0) {
    addDecorPoints(decorPointsDelta)
  }

  return {
    decorPointsDelta,
    dailyStats: saveTodayStats(nextStats),
    xpDelta
  }
}

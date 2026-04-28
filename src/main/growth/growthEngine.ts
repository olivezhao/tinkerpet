import type { DailyStats, PetEvent } from "../../shared/types"
import { loadTodayStats, saveTodayStats } from "../store/dailyStatsStore"
import { addProfileXp, loadProfile } from "../store/profileStore"

const FIRST_USE_XP = 3
const FINISHED_XP = 5
const FAILED_XP = 2

interface GrowthResult {
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

  if (!nextStats.firstUseXpAwarded) {
    xpDelta += FIRST_USE_XP
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

  return {
    dailyStats: saveTodayStats(nextStats),
    xpDelta
  }
}

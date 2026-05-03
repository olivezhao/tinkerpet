import type { DailyReportSummary, DailyStats } from "../../shared/types"
import { resolveBubbleTextByState } from "../../shared/personality"
import { loadTodayStats } from "../store/dailyStatsStore"
import { loadProfile } from "../store/profileStore"

function formatSourceName(source: string): string {
  if (!source) {
    return "Unknown"
  }

  return source
}

function resolveTopSource(stats: DailyStats): string {
  const taskKeys = [...stats.rewardedTaskKeys, ...Object.keys(stats.activeTasks)]

  if (taskKeys.length === 0) {
    return "No source yet"
  }

  const counts = new Map<string, number>()

  for (const key of taskKeys) {
    const source = key.split(":")[0] ?? "unknown"
    counts.set(source, (counts.get(source) ?? 0) + 1)
  }

  let topSource = "unknown"
  let topCount = 0

  for (const [source, count] of counts.entries()) {
    if (count > topCount) {
      topSource = source
      topCount = count
    }
  }

  return formatSourceName(topSource)
}

function buildSummaryText(
  completedCount: number,
  failedCount: number,
  totalWaitMinutes: number
): string {
  if (completedCount === 0 && failedCount === 0) {
    return "A quiet day with TinkerPet. Start a task to begin leveling up."
  }

  if (failedCount === 0) {
    return `Great run. ${completedCount} tasks completed with ${totalWaitMinutes} wait minutes.`
  }

  return `${completedCount} completed and ${failedCount} failed tasks today. Keep tinkering.`
}

export function generateDailyReportSummary(): DailyReportSummary {
  const profile = loadProfile()
  const stats = loadTodayStats()
  const totalWaitMinutes = Math.round(stats.totalWaitMs / 60000)

  return {
    activeTaskCount: Object.keys(stats.activeTasks).length,
    completedCount: stats.completedCount,
    date: stats.date,
    failedCount: stats.failedCount,
    generatedAt: Date.now(),
    level: profile.level,
    petName: profile.petName,
    personality: profile.personality,
    skinId: profile.skinId,
    startedCount: stats.startedCount,
    summaryText: `${buildSummaryText(
      stats.completedCount,
      stats.failedCount,
      totalWaitMinutes
    )} ${resolveBubbleTextByState(profile.personality, "finished")}`,
    topSource: resolveTopSource(stats),
    totalWaitMinutes,
    totalXp: profile.xp,
    todayXp: stats.xpEarned
  }
}

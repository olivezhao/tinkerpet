import type { SevenDayStats, SevenDayStatsDay } from "../../shared/types"
import { loadDailyStatsByDate } from "../store/dailyStatsStore"
import { calculateLevel, loadProfile } from "../store/profileStore"

function getDateKeyByOffset(offsetDays: number): string {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - offsetDays)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function resolveSourceDistributionForDay(stats: {
  activeTasks: Record<string, unknown>
  rewardedTaskKeys: string[]
}): Record<string, number> {
  const distribution: Record<string, number> = {}
  const keys = [...stats.rewardedTaskKeys, ...Object.keys(stats.activeTasks)]

  for (const key of keys) {
    const source = key.split(":")[0] ?? "unknown"
    distribution[source] = (distribution[source] ?? 0) + 1
  }

  return distribution
}

export function generateSevenDayStats(): SevenDayStats {
  const generatedAt = Date.now()
  const allStats = loadDailyStatsByDate()
  const days: SevenDayStatsDay[] = []
  const sourceDistribution: Record<string, number> = {}

  for (let offset = 6; offset >= 0; offset -= 1) {
    const dateKey = getDateKeyByOffset(offset)
    const stats = allStats[dateKey]

    if (!stats) {
      days.push({
        date: dateKey,
        durationMinutes: 0,
        failedTasks: 0,
        finishedTasks: 0,
        waitingSessions: 0,
        xpGained: 0
      })
      continue
    }

    days.push({
      date: dateKey,
      durationMinutes: Math.round(stats.totalWaitMs / 60000),
      failedTasks: stats.failedCount,
      finishedTasks: stats.completedCount,
      waitingSessions: stats.startedCount,
      xpGained: stats.xpEarned
    })

    const dayDistribution = resolveSourceDistributionForDay(stats)
    for (const [source, count] of Object.entries(dayDistribution)) {
      sourceDistribution[source] = (sourceDistribution[source] ?? 0) + count
    }
  }

  const profile = loadProfile()
  let rollingXp = Math.max(0, profile.xp - days.reduce((sum, day) => sum + day.xpGained, 0))
  const levelSeries = days.map((day) => {
    rollingXp += day.xpGained
    return {
      date: day.date,
      level: calculateLevel(rollingXp)
    }
  })

  return {
    generatedAt,
    days,
    levelSeries,
    sourceDistribution
  }
}

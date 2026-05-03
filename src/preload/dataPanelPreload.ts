import { contextBridge, ipcRenderer } from "electron"
import type { SevenDayStats } from "../shared/types"

const STATS_SEVEN_DAYS_GET_CHANNEL = "stats:seven-days:get"

contextBridge.exposeInMainWorld("tinkerpetDataPanel", {
  getSevenDayStats: (): Promise<SevenDayStats> =>
    ipcRenderer.invoke(STATS_SEVEN_DAYS_GET_CHANNEL)
})


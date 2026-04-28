import { contextBridge, ipcRenderer } from "electron"
import type { DailyReportSummary, ShareCardResult } from "../shared/types"

const REPORT_GET_CHANNEL = "report:get"
const SHARE_CARD_GENERATE_CHANNEL = "share-card:generate"
const SHARE_CARD_REVEAL_CHANNEL = "share-card:reveal"

contextBridge.exposeInMainWorld("tinkerpetReport", {
  getDailyReport: (): Promise<DailyReportSummary> =>
    ipcRenderer.invoke(REPORT_GET_CHANNEL),
  generateShareCard: (): Promise<ShareCardResult> =>
    ipcRenderer.invoke(SHARE_CARD_GENERATE_CHANNEL),
  revealShareCard: (filePath: string): Promise<void> =>
    ipcRenderer.invoke(SHARE_CARD_REVEAL_CHANNEL, filePath)
})

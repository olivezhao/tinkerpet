import { app, BrowserWindow, nativeImage } from "electron"
import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import type { DailyReportSummary, ShareCardResult } from "../../shared/types"

const SHARE_CARD_WIDTH = 1200
const SHARE_CARD_HEIGHT = 630

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

function getShareCardDirectory(): string {
  return join(app.getPath("documents"), "TinkerPet", "share-cards")
}

function createShareCardSvg(report: DailyReportSummary): string {
  const summary = escapeXml(report.summaryText)
  const petName = escapeXml(report.petName)
  const topSource = escapeXml(report.topSource)

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${SHARE_CARD_WIDTH}" height="${SHARE_CARD_HEIGHT}" viewBox="0 0 ${SHARE_CARD_WIDTH} ${SHARE_CARD_HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1f2937"/>
    </linearGradient>
  </defs>
  <rect width="${SHARE_CARD_WIDTH}" height="${SHARE_CARD_HEIGHT}" fill="url(#bg)" />
  <rect x="48" y="48" width="1104" height="534" rx="24" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.14)" />

  <text x="86" y="116" fill="#93c5fd" font-size="24" font-family="Inter, Arial, sans-serif" font-weight="700">TinkerPet Daily Report</text>
  <text x="86" y="176" fill="#f8fafc" font-size="54" font-family="Inter, Arial, sans-serif" font-weight="800">${petName}</text>
  <text x="86" y="218" fill="#cbd5e1" font-size="24" font-family="Inter, Arial, sans-serif">Date ${report.date}</text>

  <text x="86" y="292" fill="#e2e8f0" font-size="30" font-family="Inter, Arial, sans-serif" font-weight="700">Today XP ${report.todayXp}</text>
  <text x="86" y="332" fill="#e2e8f0" font-size="30" font-family="Inter, Arial, sans-serif" font-weight="700">Level ${report.level}</text>
  <text x="86" y="372" fill="#e2e8f0" font-size="30" font-family="Inter, Arial, sans-serif" font-weight="700">Completed ${report.completedCount}</text>
  <text x="86" y="412" fill="#e2e8f0" font-size="30" font-family="Inter, Arial, sans-serif" font-weight="700">Wait Minutes ${report.totalWaitMinutes}</text>
  <text x="86" y="452" fill="#e2e8f0" font-size="30" font-family="Inter, Arial, sans-serif" font-weight="700">Top Source ${topSource}</text>

  <text x="86" y="520" fill="#cbd5e1" font-size="22" font-family="Inter, Arial, sans-serif">${summary}</text>
  <text x="86" y="562" fill="#94a3b8" font-size="20" font-family="Inter, Arial, sans-serif">Generated ${new Date(
    report.generatedAt
  ).toLocaleString()}</text>
</svg>
`.trim()
}

function buildShareCardFileName(reportDate: string): string {
  const now = Date.now()
  return `tinkerpet-share-${reportDate}-${now}.png`
}

async function renderPngWithOffscreenWindow(svg: string): Promise<Buffer> {
  const window = new BrowserWindow({
    show: false,
    webPreferences: {
      offscreen: true
    },
    width: SHARE_CARD_WIDTH,
    height: SHARE_CARD_HEIGHT
  })

  try {
    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            html, body {
              margin: 0;
              padding: 0;
              width: ${SHARE_CARD_WIDTH}px;
              height: ${SHARE_CARD_HEIGHT}px;
              overflow: hidden;
              background: #0f172a;
            }
            img {
              width: ${SHARE_CARD_WIDTH}px;
              height: ${SHARE_CARD_HEIGHT}px;
              display: block;
            }
          </style>
        </head>
        <body>
          <img id="card" alt="share-card" />
          <script>
            const svg = ${JSON.stringify(svg)};
            const img = document.getElementById("card");
            img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
          </script>
        </body>
      </html>
    `

    await window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
    await new Promise((resolve) => setTimeout(resolve, 120))
    const image = await window.webContents.capturePage()
    return image.toPNG()
  } finally {
    window.destroy()
  }
}

export async function generateShareCard(
  report: DailyReportSummary
): Promise<ShareCardResult> {
  const svg = createShareCardSvg(report)
  const image = nativeImage.createFromDataURL(
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  )
  let pngBuffer = image.toPNG()

  if (image.isEmpty() || pngBuffer.length === 0) {
    pngBuffer = await renderPngWithOffscreenWindow(svg)
  }

  const directory = getShareCardDirectory()
  const fileName = buildShareCardFileName(report.date)
  const filePath = join(directory, fileName)

  mkdirSync(directory, { recursive: true })
  writeFileSync(filePath, pngBuffer)

  return {
    fileName,
    filePath,
    generatedAt: Date.now()
  }
}

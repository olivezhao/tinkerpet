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
  const personality = escapeXml(report.personality)
  const skinId = escapeXml(report.skinId)
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
  <text x="86" y="250" fill="#cbd5e1" font-size="20" font-family="Inter, Arial, sans-serif">Skin ${skinId} · Personality ${personality}</text>

  <text x="86" y="304" fill="#e2e8f0" font-size="30" font-family="Inter, Arial, sans-serif" font-weight="700">Today XP ${report.todayXp}</text>
  <text x="86" y="344" fill="#e2e8f0" font-size="30" font-family="Inter, Arial, sans-serif" font-weight="700">Level ${report.level}</text>
  <text x="86" y="384" fill="#e2e8f0" font-size="30" font-family="Inter, Arial, sans-serif" font-weight="700">Completed ${report.completedCount}</text>
  <text x="86" y="424" fill="#e2e8f0" font-size="30" font-family="Inter, Arial, sans-serif" font-weight="700">Wait Minutes ${report.totalWaitMinutes}</text>
  <text x="86" y="464" fill="#e2e8f0" font-size="30" font-family="Inter, Arial, sans-serif" font-weight="700">Top Source ${topSource}</text>

  <text x="86" y="520" fill="#cbd5e1" font-size="22" font-family="Inter, Arial, sans-serif">${summary}</text>
  <text x="86" y="562" fill="#94a3b8" font-size="20" font-family="Inter, Arial, sans-serif">Generated ${new Date(
    report.generatedAt
  ).toLocaleString()}</text>
</svg>
`.trim()
}

function createFallbackSvg(report: DailyReportSummary): string {
  const petName = escapeXml(report.petName)
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${SHARE_CARD_WIDTH}" height="${SHARE_CARD_HEIGHT}">
  <rect width="100%" height="100%" fill="#111827" />
  <text x="80" y="180" fill="#f8fafc" font-size="52" font-family="Arial, sans-serif" font-weight="700">${petName}</text>
  <text x="80" y="250" fill="#cbd5e1" font-size="30" font-family="Arial, sans-serif">TinkerPet share card fallback</text>
  <text x="80" y="320" fill="#93c5fd" font-size="26" font-family="Arial, sans-serif">Today XP ${report.todayXp} · Level ${report.level}</text>
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

function isNonBlankPngBuffer(buffer: Buffer): boolean {
  if (!buffer || buffer.length === 0) {
    return false
  }

  const image = nativeImage.createFromBuffer(buffer)
  if (image.isEmpty()) {
    return false
  }

  const bitmap = image.toBitmap()
  if (bitmap.length === 0) {
    return false
  }

  for (let index = 0; index < bitmap.length; index += 4) {
    const alpha = bitmap[index + 3]
    if (alpha > 0) {
      return true
    }
  }

  return false
}

export async function generateShareCard(
  report: DailyReportSummary
): Promise<ShareCardResult> {
  const svg = createShareCardSvg(report)
  const image = nativeImage.createFromDataURL(
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  )
  let pngBuffer = image.toPNG()

  if (image.isEmpty() || !isNonBlankPngBuffer(pngBuffer)) {
    pngBuffer = await renderPngWithOffscreenWindow(svg)
  }

  if (!isNonBlankPngBuffer(pngBuffer)) {
    const fallbackSvg = createFallbackSvg(report)
    const fallbackImage = nativeImage.createFromDataURL(
      `data:image/svg+xml;charset=utf-8,${encodeURIComponent(fallbackSvg)}`
    )
    pngBuffer = fallbackImage.toPNG()
  }

  if (!isNonBlankPngBuffer(pngBuffer)) {
    const fallbackSvg = createFallbackSvg(report)
    pngBuffer = await renderPngWithOffscreenWindow(fallbackSvg)
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

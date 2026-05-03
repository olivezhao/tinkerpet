const SUPPORTED_HOSTS = new Set([
  "chat.openai.com",
  "chatgpt.com",
  "claude.ai",
  "chat.deepseek.com",
  "gemini.google.com"
])

const CHATGPT_HOSTS = new Set(["chat.openai.com", "chatgpt.com"])
const DEEPSEEK_HOSTS = new Set(["chat.deepseek.com"])
const GEMINI_HOSTS = new Set(["gemini.google.com"])
const DETECTION_INTERVAL_MS = 700
const CHATGPT_GENERATING_SELECTORS = [
  "[data-testid='stop-button']",
  "button[aria-label*='Stop']",
  "button[aria-label*='停止']"
]
const GEMINI_GENERATING_SELECTORS = [
  "button[aria-label*='Stop response']",
  "button[aria-label*='Stop generating']",
  "button[aria-label*='Stop']",
  "button[aria-label*='停止回答']",
  "button[aria-label*='停止生成']",
  "button[aria-label*='停止']"
]
const DEEPSEEK_GENERATING_SELECTORS = [
  "button[aria-label*='Stop']",
  "button[aria-label*='停止']",
  "button[aria-label*='停止生成']",
  "button[aria-label*='停止回答']"
]

function detectProvider(hostname) {
  if (hostname === "claude.ai") {
    return "claude"
  }

  if (hostname === "gemini.google.com") {
    return "gemini"
  }

  if (hostname === "chat.deepseek.com") {
    return "deepseek"
  }

  if (hostname === "chat.openai.com" || hostname === "chatgpt.com") {
    return "chatgpt"
  }

  return null
}

function isVisible(element) {
  const rect = element.getBoundingClientRect()
  const style = window.getComputedStyle(element)

  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.display !== "none" &&
    style.visibility !== "hidden"
  )
}

function findVisibleSelector(selectors) {
  return (
    selectors.find((selector) =>
      Array.from(document.querySelectorAll(selector)).some(isVisible)
    ) ?? null
  )
}

function getGeneratingState(selectors) {
  const signal = findVisibleSelector(selectors)

  return {
    generating: signal !== null,
    signal
  }
}

function createTaskId(provider) {
  return `${provider}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
}

function sendAiEvent(provider, event) {
  chrome.runtime.sendMessage({
    event,
    provider,
    type: "TINKERPET_AI_EVENT"
  })
}

function sendDetectorStatus(provider, detector, status) {
  chrome.runtime.sendMessage({
    provider,
    status: {
      detector,
      host: window.location.hostname,
      ...status
    },
    type: "TINKERPET_DETECTOR_STATUS"
  })
}

function startAiDetector(config) {
  let activeTask = null
  let lastGenerating = false
  let lastStatusKey = ""

  function updateDetectorStatus(generating, signal) {
    const statusKey = `${generating}:${signal ?? "none"}`

    if (statusKey === lastStatusKey) {
      return
    }

    lastStatusKey = statusKey
    sendDetectorStatus(config.provider, config.detector, {
      generating,
      lastSignal: signal ?? "none",
      status: generating ? "generating" : "idle"
    })
  }

  function evaluate() {
    const { generating, signal } = getGeneratingState(config.generatingSelectors)
    const now = Date.now()

    updateDetectorStatus(generating, signal)

    if (generating && !lastGenerating) {
      activeTask = {
        startedAt: now,
        taskId: createTaskId(config.provider)
      }
      sendAiEvent(config.provider, {
        metadata: {
          detector: config.detector,
          host: window.location.hostname
        },
        provider: config.provider,
        source: "browser-extension",
        sourceType: "browser",
        startedAt: now,
        statusText: config.startedStatusText,
        taskId: activeTask.taskId,
        timestamp: now,
        title: config.title,
        type: "AI_TASK_STARTED"
      })
    }

    if (!generating && lastGenerating && activeTask) {
      sendAiEvent(config.provider, {
        durationMs: now - activeTask.startedAt,
        endedAt: now,
        metadata: {
          detector: config.detector,
          host: window.location.hostname
        },
        provider: config.provider,
        source: "browser-extension",
        sourceType: "browser",
        startedAt: activeTask.startedAt,
        statusText: config.finishedStatusText,
        taskId: activeTask.taskId,
        timestamp: now,
        title: config.title,
        type: "AI_TASK_FINISHED"
      })
      activeTask = null
    }

    lastGenerating = generating
  }

  const observer = new MutationObserver(evaluate)
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  })

  window.setInterval(evaluate, DETECTION_INTERVAL_MS)
  sendDetectorStatus(config.provider, config.detector, {
    generating: false,
    lastSignal: "detector-started",
    status: "ready"
  })
  evaluate()
}

if (SUPPORTED_HOSTS.has(window.location.hostname)) {
  chrome.runtime.sendMessage({
    provider: detectProvider(window.location.hostname),
    type: "TINKERPET_CONTENT_READY"
  })
}

if (CHATGPT_HOSTS.has(window.location.hostname)) {
  startAiDetector({
    detector: "chatgpt-dom",
    finishedStatusText: "ChatGPT generation finished",
    generatingSelectors: CHATGPT_GENERATING_SELECTORS,
    provider: "chatgpt",
    startedStatusText: "ChatGPT is generating",
    title: "ChatGPT response"
  })
}

if (GEMINI_HOSTS.has(window.location.hostname)) {
  startAiDetector({
    detector: "gemini-dom",
    finishedStatusText: "Gemini generation finished",
    generatingSelectors: GEMINI_GENERATING_SELECTORS,
    provider: "gemini",
    startedStatusText: "Gemini is generating",
    title: "Gemini response"
  })
}

if (DEEPSEEK_HOSTS.has(window.location.hostname)) {
  startAiDetector({
    detector: "deepseek-dom",
    finishedStatusText: "DeepSeek generation finished",
    generatingSelectors: DEEPSEEK_GENERATING_SELECTORS,
    provider: "deepseek",
    startedStatusText: "DeepSeek is generating",
    title: "DeepSeek response"
  })
}

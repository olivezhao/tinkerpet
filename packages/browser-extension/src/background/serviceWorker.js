import {
  getConnectionSnapshot,
  heartbeatSource,
  postPetEvent,
  updateDetectorDebug
} from "../shared/bridgeClient.js"

chrome.runtime.onInstalled.addListener(() => {
  void chrome.storage.local.set({
    tinkerpetInstalledAt: Date.now()
  })
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "TINKERPET_HEALTH_CHECK") {
    if (message?.type === "TINKERPET_CONTENT_READY") {
      void updateDetectorDebug(message.provider, {
        detector: `${message.provider}-dom`,
        generating: false,
        lastSignal: "content-ready",
        status: "ready"
      }).then(() => {
        sendResponse({
          ok: true
        })
      })
      return true
    }

    if (message?.type === "TINKERPET_DETECTOR_STATUS") {
      void updateDetectorDebug(message.provider, message.status).then(() => {
        sendResponse({
          ok: true
        })
      })
      return true
    }

    if (message?.type !== "TINKERPET_AI_EVENT") {
      return false
    }

    void postPetEvent(message.provider, message.event)
      .then(async (payload) => {
        await heartbeatSource(message.provider)
        sendResponse({
          ok: true,
          payload
        })
      })
      .catch((error) => {
        sendResponse({
          error: error instanceof Error ? error.message : "Unknown bridge error",
          ok: false
        })
      })
    return true
  }

  void getConnectionSnapshot().then(sendResponse)
  return true
})

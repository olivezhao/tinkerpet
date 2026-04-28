import {
  getBridgeOrigin,
  getConnectionSnapshot,
  getDetectorDebugSnapshot,
  setBridgeOrigin
} from "../shared/bridgeClient.js"

const bridgeOriginInput = document.querySelector("#bridgeOrigin")
const detectorOutput = document.querySelector("#detectorOutput")
const detectorRefreshButton = document.querySelector("#detectorRefreshButton")
const healthOutput = document.querySelector("#healthOutput")
const refreshButton = document.querySelector("#refreshButton")
const saveButton = document.querySelector("#saveButton")
const statusText = document.querySelector("#statusText")

function setStatus(text, details = "") {
  statusText.textContent = text
  healthOutput.textContent = details
}

async function refreshStatus() {
  setStatus("Checking...")

  const snapshot = await getConnectionSnapshot()

  if (!snapshot.ok) {
    setStatus("Desktop offline", snapshot.error)
    return
  }

  setStatus("Desktop online", JSON.stringify(snapshot.health, null, 2))
}

async function refreshDetectorDebug() {
  const snapshot = await getDetectorDebugSnapshot()
  detectorOutput.textContent = JSON.stringify(snapshot, null, 2)
}

async function saveBridgeOrigin() {
  const value = bridgeOriginInput.value.trim()

  if (!value.startsWith("http://127.0.0.1:")) {
    setStatus("Invalid local bridge URL", "Use http://127.0.0.1:<port>")
    return
  }

  await setBridgeOrigin(value)
  await refreshStatus()
}

async function init() {
  bridgeOriginInput.value = await getBridgeOrigin()
  await refreshStatus()
  await refreshDetectorDebug()
}

detectorRefreshButton.addEventListener("click", () => {
  void refreshDetectorDebug()
})

refreshButton.addEventListener("click", () => {
  void refreshStatus()
})

saveButton.addEventListener("click", () => {
  void saveBridgeOrigin()
})

void init()

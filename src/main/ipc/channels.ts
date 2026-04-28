export const IPC_CHANNELS = {
  DEBUG_EVENT_LOG_CLEAR: "debug:event-log-clear",
  DEBUG_EVENT_SEND: "debug:event-send",
  DEBUG_SNAPSHOT_GET: "debug:snapshot-get",
  DEBUG_SNAPSHOT_UPDATED: "debug:snapshot-updated",
  PROFILE_GET: "profile:get",
  PROFILE_UPDATE_NAME: "profile:update-name",
  PET_EVENT: "pet:event",
  REPORT_GET: "report:get",
  SHARE_CARD_GENERATE: "share-card:generate",
  SHARE_CARD_REVEAL: "share-card:reveal"
} as const

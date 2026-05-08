import type { PetEventType, PetPersonality, PetState } from "./types"

type PersonalityCopyKey =
  | "failed"
  | "finished"
  | "idle"
  | "long_wait"
  | "sleeping"
  | "started"
  | "waiting"

const PERSONALITY_COPY: Record<
  PetPersonality,
  Record<PersonalityCopyKey, string>
> = {
  calm: {
    failed: "收到失败信号，建议重试。",
    finished: "任务完成，状态良好。",
    idle: "待命中。",
    long_wait: "还在处理，进度稳定。",
    sleeping: "省电模式中。",
    started: "开始处理了。",
    waiting: "正在等待结果。"
  },
  encourage: {
    failed: "这次没过，咱们再来一把。",
    finished: "漂亮！这波完成得很稳。",
    idle: "我在这，随时开工。",
    long_wait: "还在跑，我会一直盯着。",
    sleeping: "先眯一会儿，有事喊我。",
    started: "收到任务，马上开工。",
    waiting: "努力处理中，快有结果啦。"
  },
  tease: {
    failed: "翻车了，但问题不大。",
    finished: "搞定，今天状态很能打。",
    idle: "你摸鱼我放哨。",
    long_wait: "这任务真能磨，不过快了。",
    sleeping: "我休眠一下，别偷偷加班。",
    started: "新活来了，开整。",
    waiting: "还在转圈圈，别急。"
  }
}

function eventTypeToKey(eventType: PetEventType): PersonalityCopyKey {
  if (eventType.endsWith("_STARTED")) {
    return "started"
  }
  if (eventType.endsWith("_FINISHED")) {
    return "finished"
  }
  if (eventType.endsWith("_FAILED")) {
    return "failed"
  }

  return "waiting"
}

export function resolveBubbleTextByEvent(
  personality: PetPersonality,
  eventType: PetEventType
): string {
  return PERSONALITY_COPY[personality][eventTypeToKey(eventType)]
}

export function resolveBubbleTextByState(
  personality: PetPersonality,
  state: PetState
): string {
  if (state === "sleeping") {
    return PERSONALITY_COPY[personality].sleeping
  }
  if (state === "idle") {
    return PERSONALITY_COPY[personality].idle
  }
  if (state === "waiting") {
    return PERSONALITY_COPY[personality].waiting
  }
  if (state === "finished") {
    return PERSONALITY_COPY[personality].finished
  }

  return PERSONALITY_COPY[personality].failed
}

export function resolveLongWaitText(personality: PetPersonality): string {
  return PERSONALITY_COPY[personality].long_wait
}


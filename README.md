# TinkerPet

> 桌面 AI 陪伴机器人 / Desktop AI Companion Robot

---

## 中文介绍

### 项目背景

随着 AI 在办公、编码、创作场景中的普及，用户出现了大量“等待 AI 执行结果”的碎片时间。  
TinkerPet 旨在把这段等待从“空转焦虑”变成“轻量陪伴 + 明确反馈 + 可玩互动”。

### 项目价值

- **降低等待焦虑**：等待中有状态感与陪伴感，不再只是盯着进度条。
- **提升反馈效率**：任务完成时用明显但克制的视觉信号提醒用户回到主任务。
- **增强留存体验**：通过成长值、战绩、日报等机制形成连续使用动机。
- **保持低打扰**：动作节奏有冷却与降频控制，避免持续吸引注意力。

### 机器人效果图

![TinkerPet Runtime Robot](docs/images/robot-runtime.png)

> 上图为当前开发版本在本地运行时自动截取的机器人效果（非早期概念图）。

### 核心能力（当前版本）

1. 桌面宠物常驻（macOS）
2. AI/工作流事件驱动状态切换（started/finished/failed）
3. 3D 机器人渲染与动作调度（V0.6）
4. 完成提醒特效（纸飞机/信封）
5. Quick Play 五子棋对战
6. 成长体系（XP/Level/Decor）+ 每日报告 + 分享卡片

### 3D 模型来源

- 运行时模型：`src/renderer/pet/assets3d/models/robot.glb`
- 来源页面（用于溯源）：[Sketchfab Robot](https://sketchfab.com/3d-models/robot-80a736ddac1044299b134cfcca87c7f9)

---

## English Overview

### Why TinkerPet

As AI tools become part of daily work and coding, users spend more micro-moments waiting for results.  
TinkerPet turns those waiting moments into a lightweight loop of companionship, clear completion signals, and playful interaction.

### Product Value

- **Reduce waiting anxiety** with visible state and companion behavior.
- **Improve attention handoff** with clear completion cues.
- **Increase retention** through growth mechanics, match history, and daily reports.
- **Stay non-intrusive** via rhythm controls, cooldown, and long-wait frequency reduction.

### Current Highlights

1. Always-on desktop pet window (macOS)
2. Event-driven state transitions from AI/workflow updates
3. 3D robot runtime with motion scheduler (V0.6)
4. Completion notification effects (paper-plane/envelope)
5. Quick Play Gomoku mini-game
6. Local progression loop (XP/Level/Decor) + report + share card

### Robot Asset

- Runtime asset: `src/renderer/pet/assets3d/models/robot.glb`
- Source page: [Sketchfab Robot](https://sketchfab.com/3d-models/robot-80a736ddac1044299b134cfcca87c7f9)

Runtime preview image:

![TinkerPet Runtime Robot](docs/images/robot-runtime.png)

---

## Tech Stack

- Electron
- React + TypeScript
- Vite / electron-vite
- Three.js
- Local JSON persistence

## Quick Start

```sh
npm install
npm run dev
```

Launch the app and open actions from the `TinkerPet` menu bar item:
- Settings
- Debug Panel
- Daily Report
- Quick Play

## Scripts

- `npm run dev` - start app in development mode
- `npm run typecheck` - TypeScript check
- `npm run lint` - ESLint check
- `npm run build` - production build

## Verification

```sh
npm run typecheck
npm run lint
npm run build
```

## Local Event Bridge

Token and port are stored in:

```sh
~/Library/Application Support/tinkerpet/tinkerpet-config.json
```

Default endpoint:

```txt
http://127.0.0.1:17321/events
```

Example payload:

```json
{
  "type": "AI_TASK_STARTED",
  "source": "manual-test",
  "title": "Generating report"
}
```

Supported event types:

- `AI_TASK_STARTED`
- `AI_TASK_FINISHED`
- `AI_TASK_FAILED`
- `WORKFLOW_TASK_STARTED`
- `WORKFLOW_TASK_FINISHED`
- `WORKFLOW_TASK_FAILED`

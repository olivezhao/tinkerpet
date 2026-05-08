# TinkerPet

TinkerPet is a desktop companion for AI work sessions, focused on one thing:
turning “AI waiting time” into a lightweight, playful, and non-intrusive experience.

When your AI tasks are running, TinkerPet stays on desktop, reacts to task state changes,
and gives clear completion feedback so users can shift attention back at the right moment.

## What This Project Is

TinkerPet is currently a macOS-first desktop app prototype that combines:

- Event-driven desktop pet behavior
- 3D robot rendering and motion scheduling
- Quick Play mini-game (Gomoku)
- Local growth loop (XP, level, decor points)
- Daily report and share card output

This repository contains both product iteration artifacts and executable app code.

## Core Product Experience

1. **Always-on desktop companion**
   - Transparent frameless pet window
   - Menu bar tray control (show/hide/reset/settings/report/quick-play)

2. **AI waiting-state reactions**
   - Event bridge receives AI/workflow events
   - Pet switches among idle/waiting/finished/failed/sleeping states

3. **V0.6 motion system**
   - Idle walk loop + occasional jog burst
   - Waiting showcase pool (random short performances)
   - Completion signal FX (paper-plane/envelope)
   - Anti-fatigue rhythm controls

4. **Retention loop**
   - Local progression (XP/level/decor)
   - Quick Play match history
   - Daily report + share card

## Robot 3D Model

Current runtime model source:

- Sketchfab: [Robot (model page)](https://sketchfab.com/3d-models/robot-80a736ddac1044299b134cfcca87c7f9)
- Local asset in repo: `src/renderer/pet/assets3d/models/robot.glb`

> Note: previous README preview image has been removed because it was an early concept image and not the exact runtime 3D model source page.

## Architecture Snapshot

- **Desktop App**: Electron
- **UI**: React + TypeScript
- **Build**: Vite / electron-vite
- **3D Runtime**: Three.js
- **Storage**: local JSON files (app data directory)
- **Event Ingestion**: local HTTP bridge + debug/manual event injection

## Quick Start

```sh
npm install
npm run dev
```

After launch, use the `TinkerPet` menu bar item to open:
- Settings
- Debug Panel
- Daily Report
- Quick Play

## Main Scripts

- `npm run dev` — start app in development mode
- `npm run typecheck` — TypeScript check
- `npm run lint` — ESLint check
- `npm run build` — production build

## Verification

```sh
npm run typecheck
npm run lint
npm run build
```

## Local Event Bridge

The bridge accepts authenticated events and drives pet state transitions.

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

## Project Status

- Current branch baseline includes V0.5 Quick Play + V0.6 motion system implementation.
- Product/technical/AI-plan docs follow versioned evolution under:
  - `/Users/olive/Documents/New project/02-versions`

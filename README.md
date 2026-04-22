# TinkerPet

A tiny robot desktop pet that keeps you company while AI gets things done.

TinkerPet is a macOS desktop companion prototype for AI waiting moments. It lives as a small transparent pet window, reacts to workflow events, and provides a local Debug Panel for manually testing state changes.

## V0.1 Features

- Transparent frameless desktop pet window.
- macOS menu bar entry for show, hide, reset position, and quit.
- Debug Panel for manual event triggering and event log inspection.
- Local HTTP event bridge at `http://127.0.0.1:17321/events`.
- Persistent local config and recent event log.
- CSS-based placeholder robot pet animations.

## Development

```sh
npm install
npm run dev
```

After launch, click the `TinkerPet` item in the macOS menu bar to open the menu or Debug Panel.

## Verification

```sh
npm run typecheck
npm run lint
npm run build
```

## Local Event Bridge

The bridge accepts authenticated events using the bearer token stored in the local app config:

```sh
~/Library/Application Support/tinkerpet/tinkerpet-config.json
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

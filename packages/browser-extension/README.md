# TinkerPet Browser Extension

Chrome Manifest V3 extension skeleton for TinkerPet V0.2.

## Local Load

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select `/Users/olive/Documents/code/tinkerpet/packages/browser-extension`.

## Current Scope

- Options page can call `http://127.0.0.1:17321/health`.
- Background service worker exposes a health-check message.
- Content script is injected only on ChatGPT, Claude, and Gemini domains.
- Permissions avoid `<all_urls>`.

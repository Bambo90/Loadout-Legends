Original prompt: Du warst grade dabei irgendwas für das zukünftige Wrapping minimal invasiv umzubauen und plötzlicher ist der ganze Chat weg gewesen. Ich glaube es ist nicht kaputt Abgesehen davon, wenn ich nun im Abenteuer-Zentrum über die Kacheln Hover wie Chroniken, Arena etc. wird das, was dann ausfährt plötzlich unten abgeschnitten und in einem kleinen Scrollbaren Container angezeigt, was so nicht soll

- 2026-02-13: Investigated clipping/scroll issue in Adventure hub dropdowns.
- 2026-02-13: Applied minimal CSS fix in `style.css`:
  - `#tab-grind:not(.world-view)` now handles vertical scrolling (no nested mini-scroll container).
  - `#tab-grind:not(.world-view) .adventure-hub` no longer constrains `max-height` and no longer uses internal overflow.
- 2026-02-13: Tried running the skill Playwright client, but it currently fails to resolve `playwright` when executing from `C:/Users/bbs2e/.codex/skills/develop-web-game/scripts/web_game_playwright_client.js` (`ERR_MODULE_NOT_FOUND`).
- 2026-02-13: Zone submenu (Kuestenpfad) CTA fix: `Kampf starten` no longer slides sideways on hover; kept highlight behavior by overriding hover transform for `.zone-start-btn`.
- 2026-02-13: Kuestenpfad monster stats overlay now unfolds from the right edge of the monster container with a 5px gap (`.zone-stats-panel` anchored via `left: calc(100% + 5px)` and slide-in transform on hover).
- 2026-02-13: Verification attempt repeated; skill Playwright client still blocked by missing module resolution (`ERR_MODULE_NOT_FOUND: playwright`) from the skill script path.
- TODO: Run visual regression check in browser/Playwright to confirm dropdowns are fully visible on hover for Chroniken/Arena/Ressourcen and no side effects in world/zone view.

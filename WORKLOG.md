# WORKLOG (Private notes for assistant)

This file is a concise, timestamped log meant for the assistant to update during development sessions. It is intended to capture important changes, decisions, and short next-steps so you don't have to re-explain context each time.

AI Automation Convention
- `AI_AUTOMATIC_UPDATE: true` — convention flag the assistant will look for to indicate it should update this file at session start/end when requested.

Session Close Checklist (what assistant will remind you to do besides saving):
- Commit your work: `git add . && git commit -m "WIP: <short summary>"`
- Push changes: `git push`
- Optionally run `npm run worklog "Session end: <short note>"` to append a final note and create a commit for the worklog.
- Close VS Code when ready.

---

## Entries

### 2026-02-10 12:00:00 (AI)
- **Summary**: Merged local repo with remote, resolved 14 add/add conflicts by keeping local versions. Pushed to GitHub. Created release v0.1.0 and CI workflow. Added `customDrag.js`, queued render fixes, and Electron scaffold.
- **Next**: Continue with game features (items/skills/monsters). The assistant will update this file at session boundaries if `AI_AUTOMATIC_UPDATE` is present.


<!-- Add new AI or user entries below using the `npm run worklog "message"` helper or by manual edit. -->

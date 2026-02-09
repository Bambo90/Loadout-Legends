# Release Guide

How to cut a release and distribute patches.

## Semver Versioning

Follow semantic versioning:
- **Major** (1.0.0): Breaking game mechanic changes
- **Minor** (0.1.0): New features (new items, skills, etc.)
- **Patch** (0.1.1): Bug fixes, balance tweaks

## Release Steps

### 1. Update Version in `package.json`

Edit `package.json` and bump the version:
```json
"version": "0.2.0"
```

### 2. Commit & Tag

```bash
git add package.json
git commit -m "chore: bump to v0.2.0"
git tag -a v0.2.0 -m "Release v0.2.0: Add PvP Arena"
git push origin main
git push origin v0.2.0
```

### 3. Create GitHub Release

- Go to GitHub Repo → Releases → Draft New Release
- Select the tag you just pushed (e.g., `v0.2.0`)
- Add release notes (what changed, fixes, new features)
- Attach builds:
  - Web `.zip` (all .html/.js/.css files)
  - Windows `.exe` (if using Electron Builder)
  - macOS `.dmg` (if using Electron Builder)

### 4. Auto-Update (Optional)

If using Electron:
- CI/build script generates `.exe`, `.dmg`, etc. to GitHub Release assets
- Electron `electron-updater` checks GitHub Releases on startup
- Users get automatic updates (or manual download from release page)

## Hotfix (Emergency Patch)

For urgent fixes (broken save game, exploit, crash):

```bash
git checkout -b hotfix/critical-bug-name
git commit -m "fix: critical exploit in PvP"
git push origin hotfix/critical-bug-name
# Create PR, merge to main
git tag -a v0.1.1 -m "Fix: critical PvP exploit"
git push origin v0.1.1
# Then create GitHub Release as above
```

## Development Branch Workflow

- Main branch = stable releases only
- Create feature branches for new work:
  ```bash
  git checkout -b feature/new-skill-system
  # ... work ...
  git push origin feature/new-skill-system
  # Create PR on GitHub, code review, merge when ready
  ```

## Distribution Channels

1. **GitHub Releases** (free, always available)
   - Players download .zip or .exe directly
2. **itch.io** (indie game hub, free)
   - Upload .zip or .exe; itch auto-updates players
3. **Steam** (requires Steamworks account, ~$100 one-time)
   - Uses Steamworks SDK for auto-update
4. **Web** (GitHub Pages, Netlify, etc.)
   - Host the web version directly; no updates needed (always latest)

For now, stick with **GitHub Releases** + **Web hosting** (free tier Netlify/GitHub Pages).

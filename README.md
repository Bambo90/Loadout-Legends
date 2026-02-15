# Loadout Legends

Regel 1:
Simulation ist immer rein logisch.

Regel 2:
Item-Instanz ist immer serialisierbar.

Regel 3:
UI darf nur anzeigen, nie rechnen.

A grid-based, idle progression plus loadout combat game mixing Melvor Idle and Backpack Battles mechanics.

Current snapshot:
- Runtime baseline: `v0.2.2` (plus in-progress world and adventure UI updates)
- Core drag runtime: `customDrag.js` exposed via `window.DragSystem`

## Local Development

### Quick start (Web + Static Server)

1. Open a terminal in the project root:
```bash
cd "c:\Users\bbs2e\Desktop\Loadout Legends"
```

2. Start a local server (requires Node.js):
```bash
npx http-server . -p 8080
```

3. Open [http://localhost:8080](http://localhost:8080) in your browser.

### Electron (Desktop App)

1. Install dependencies:
```bash
npm install
```

2. Run in Electron:
```bash
npm run electron:dev
```

## Project Structure

- `index.html` - Main HTML entry point
- `script.js` - Core game loop and UI orchestration
- `style.css` - Styling for tabs, workshop, world and zone views
- `customDrag.js` - Encapsulated drag and rotation runtime (`window.DragSystem`)
- `dragdropengine.js`, `gridEngine.js`, `workshopEngine.js`, `saveengine.js` - Core mechanics
- `worldData.js`, `combatEngine.js`, `monsters.js` - World, zone and combat systems
- `.github/workflows/ci.yml` - Automated checks on push

## Version Control and Releases

```bash
git init
git add .
git commit -m "Initial commit: Loadout Legends"
git remote add origin https://github.com/youruser/loadout-legends.git
git push -u origin main
```

Create a release tag:
```bash
git tag -a v0.2.2 -m "Release v0.2.2"
git push origin v0.2.2
```

Then use GitHub Releases to attach builds/installers.

## Development Workflow

- Create feature branches: `git checkout -b feature/name`
- Push to GitHub and create Pull Request
- CI runs lint and build checks
- Merge to `main` when ready
- Tag and release via GitHub Releases

## Build and Distribution

- **Web**: Deploy to GitHub Pages, Netlify, or any static host
- **Desktop (Electron)**: Package with `npm run electron:build`
- **Mobile**: Optional future port via Flutter or React Native

## License

TBD (add your license here)

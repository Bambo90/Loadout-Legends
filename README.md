# Loadout Legends

A grid-based, idle progression + loadout combat game mixing Melvor Idle and Backpack Battles mechanics.

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

- `index.html` – Main HTML entry point
- `script.js` – Core game loop & UI logic
- `style.css` – All styling
- `*Engine.js` – Modular systems (items, grid, drag, workshop, save, etc.)
- `.github/workflows/ci.yml` – Automated tests & builds on push

## Version Control & Releases

```bash
git init
git add .
git commit -m "Initial commit: Loadout Legends v0.1.0"
git remote add origin https://github.com/youruser/loadout-legends.git
git push -u origin main
```

Create a release tag:
```bash
git tag -a v0.1.0 -m "v0.1.0: Initial release"
git push origin v0.1.0
```

Then use GitHub Releases to attach builds/installers.

## Development Workflow

- Create feature branches: `git checkout -b feature/name`
- Push to GitHub; create Pull Request
- CI runs lint + build checks
- Merge to `main` when ready
- Tag & release via GitHub Releases

## Build & Distribution

- **Web**: Deploy to GitHub Pages, Netlify, or any static host
- **Desktop (Electron)**: Package with `npm run electron:build` (setup in CI)
- **Mobile**: Consider Flutter/React Native later if needed

## License

TBD (add your license here)

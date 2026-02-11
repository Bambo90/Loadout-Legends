# Loadout Legends - Game Design & Project Guidelines

**Central design system & project roadmap**  
Diese Datei ist die zentrale Referenz für Konzepte, Design-Entscheidungen, Farbschema und Roadmap.

---

## 🎨 Farbschema & UI Design

### Hauptfarben
```css
--bg-dark: #0a0a0a          /* Haupt-Hintergrund */
--bg-panel: #161616         /* Panel/Card-Hintergrund */
--accent-gold: #ffd700      /* Gold/Premium-Akzent */
--accent-blue: #2196F3      /* Aktions-Buttons, Links */
--accent-red: #ff3b3b       /* Gefahren, Warnungen */
--border-color: #333        /* Standard-Rahmen */
```

### Rarity-Farben
```css
Common (Weiß):   #ffffff
Magic (Blau):    #2196F3
Rare (Gelb):     #FFD700
Legendary (Orange): #FF6B35
```

### UI-Richtlinien
- **Button-Design**: Gradient-Backgrounds, 2px border, 8px border-radius, Hover mit transform: translateY(-2px)
- **Panel-Spacing**: 15px padding, 12px border-radius, 2px border
- **Grid-Gaps**: 8px zwischen Items
- **Slot-Größe**: 64px × 64px
- **Icon-Größe**: 2rem (32px) für Item-Icons

### Typografie
- **Hauptfont**: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif
- **Headlines**: Font-weight 600-700
- **Body**: Font-weight 400
- **Farbe**: #eee (Standard-Text), #ccc (Secondary)

---

## 🎮 Kern-Spielmechaniken

### Body/Aura System (V0.2.0 - IMPLEMENTIERT)
**Konzept**: Backpack Battles-inspiriertes Inventarsystem
- **Body**: 1×1 Collision-Shape (definiert Platzierung)
- **Aura**: 3×3+ Effect-Zone (visuell, keine Collision)
- **Rotation**: Items können mit R-Taste oder Mausrad rotiert werden (90°, 180°, 270°)
- **Persistenz**: Rotierte Auras bleiben beim Speichern/Laden erhalten
- **Pickup**: Aufheben behält Rotation bei (kein Reset)

**Regel**: Auras wirken auf andere Bodies, aber ohne Collision-Check
→ Items können überlappende Auras haben

### Grid-System
- **Storage (Bank)**: 6 Spalten × 5 Reihen (30 Slots, erweiterbar)
- **Ausrüstung (Farm/PVE/PVP)**: 5×5 Grid (25 Slots)
- **Drag & Drop**: Custom pointer-based system (customDrag.js)
- **Preview**: Grün (valid) / Rot (invalid) während Drag

---

## 🗺️ Roadmap & Features

### ✅ Abgeschlossen (V0.2.0)
- [x] Body/Aura Separation für alle Tools
- [x] Aura Rotation (R-Taste, Mausrad)
- [x] Aura Persistence (speichert rotierte Zustände)
- [x] Aura Grid-Clipping (versteckt Out-of-bounds Cells)
- [x] Pickup Rotation Preservation
- [x] Storage UI Cleanup (kein "Storage Storage", "Grid" versteckt)
- [x] Speichern-Button Redesign (blauer Gradient, Icon)

### 🔄 In Progress
- [ ] Body/Aura System auf alle Items erweitern:
  - [ ] Schwerter (Swords)
  - [ ] Bögen (Bows)
  - [ ] Rüstung (Armor)
  - [ ] Schmuck (Jewelry)
  - [ ] Schilde (Shields)
- [ ] Storage-only Mode finalisieren (kein Equipment-Grid)

### 📋 Geplant (Backlog)
- [ ] Auto-Update System (Electron)
- [ ] Unique Item Tracking (Instance IDs für Stackables vs Uniques)
- [ ] Item-Tooltips mit Stat-Details
- [ ] Aura-Effekt Visualisierung (welche Stats werden gebufft)
- [ ] Inventory-Erweiterung kaufen (Gold-Sink)
- [ ] Quick-Stack Button (alle Items ins Storage)
- [ ] Loadout-Presets (mehrere Setups speichern/wechseln)

### 💡 Ideen (Noch nicht priorisiert)
- [ ] Crafting/Upgrade-System
- [ ] Set-Boni (mehrere Items gleicher Kategorie)
- [ ] Enchanting (Aura-Modifikation)
- [ ] Item-Fusion (zwei Items kombinieren)
- [ ] Achievement-System

---

## 📐 Technische Architektur

### File Organization
```
Core Systems:
- script.js          → Main game loop, UI state
- saveengine.js      → Save/Load persistence
- gridEngine.js      → Grid collision & placement logic
- customDrag.js      → Drag & drop system
- dragEngine.js      → Rotation & preview logic
- workshopEngine.js  → Grid rendering

Item Definitions:
- tools.js           → Pickaxes (V0.2.0 - Body/Aura DONE)
- swords.js          → Swords (TODO: Body/Aura)
- bows.js            → Bows (TODO: Body/Aura)
- armor.js           → Armor (TODO: Body/Aura)
- jewelry.js         → Jewelry (TODO: Body/Aura)
- shields.js         → Shields (TODO: Body/Aura)
- weapons.js         → Legacy (deprecated?)
- accessories.js     → Misc items

Registry:
- itemRegistry.js    → Central item lookup
```

### Drag & Drop Flow
1. **pointerdown** → startCustomDrag() (customDrag.js)
2. **pointermove** → Updates follow element position
3. **R-key/wheel** → applyRotation() (dragEngine.js)
4. **pointerup** → placeItemIntoGrid() (gridEngine.js)

### Save Format
```javascript
{
  bank: [...],           // Storage items
  farmGrid: [...],       // Farm equipment
  pveGrid: [...],        // PVE equipment
  pvpGrid: [...],        // PVP equipment
  gold: 0,
  xp: 0
}
```

**Grid Cell Structure**:
```javascript
{
  itemId: "bronze_pickaxe",
  instanceId: "uuid-1234",
  rotatedAura: [[1,1,1],[0,1,0],[0,1,0]] || null
}
```

---

## 🛠️ Development Workflow

### Code Standards
- **ES6+**: Use modern JavaScript (const/let, arrow functions, destructuring)
- **Comments**: Deutsch für Game-Logic, Englisch für Tech-Details
- **Logging**: Use emoji prefixes (✅ success, ❌ error, 🔄 process, 📦 data)
- **Git**: Conventional Commits (feat:, fix:, chore:, docs:)

### Testing Checklist (vor Release)
- [ ] Drag & Drop funktioniert (alle Grids)
- [ ] Rotation funktioniert (R-Taste, Mausrad)
- [ ] Save & Load erhält Rotation
- [ ] Aura wird korrekt dargestellt (Hover, Alt-Taste)
- [ ] Grid-Clipping funktioniert (keine Overflow-Aura)
- [ ] Verkaufen funktioniert (Sell-Zone)
- [ ] Console hat keine Errors

---

## 🎯 Design-Prinzipien

### Core Philosophy
**"Tactile Grid Mastery"** - Spieler sollen Spaß am Tetris-artigen Optimieren haben
- Platzierung = Strategy
- Rotation = Skill Expression
- Auren = Visual Feedback
- No Clutter = Clear Information

### UX-Prioritäten
1. **Clarity**: Was passiert gerade? (Clear Feedback)
2. **Consistency**: Gleiche Actions → Gleiche Results
3. **Forgiveness**: Undo-freundlich, keine Bestrafung für Experimente
4. **Progression**: Immer etwas zum Freischalten/Verbessern

### Performance
- Render-Optimierung: queueRenderWorkshopGrids() verwendet requestAnimationFrame
- Keine DOM-Manipulationen im Drag-Loop
- CSS transforms statt position changes

---

## 📝 Notizen & Learnings

### Wichtige Fixes (Für Referenz)
**Problem**: Tools hatten 3×3 Body → Aura blockierte Placement  
**Lösung**: Body = [[1]] (1×1), Aura = [[1,1,1],[0,1,0],[0,1,0]]  
**Learning**: Body = Collision, Aura = Visual-only

**Problem**: Rotierte Aura springt beim Pickup zurück  
**Lösung**: `cell.rotatedAura` an `startCustomDrag()` übergeben  
**Learning**: State muss durch komplette Drag-Chain durchgereicht werden

**Problem**: Aura rendert außerhalb Grid trotz overflow:hidden  
**Lösung**: Boundary-Check in Render-Loop einbauen  
**Learning**: Absolute-positioned Elements escapen Container-Clipping

---

## 🎪 Storage vs Equipment Modes

### Storage Mode (openWorkshop('storage'))
- **Zeigt**: Nur Storage-Grid (6 Spalten, erweiterbar)
- **Versteckt**: Equipment-Grid, "Grid"-Label
- **Zweck**: Reine Lagerverwaltung, Sortierung, Verkauf

### Equipment Mode (Farm/PVE/PVP)
- **Zeigt**: Storage-Grid (6 Spalten) + Equipment-Grid (5×5)
- **Zeigt**: "Grid"-Label mit aktivem Setup-Namen
- **Zweck**: Loadout-Optimierung, Aura-Synergien testen

---

**Last Updated**: v0.2.0 (2026-02-10)  
**Maintainer**: Bambo90 + GitHub Copilot

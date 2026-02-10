# Item System Guide

## Überblick

Das Item-System ist in mehrere Dateien organisiert, eine für jede Itemkategorie:

- **tools.js** - Werkzeuge (Spitzhacken, etc.)
- **swords.js** - Schwerter (Nahkampfwaffen)
- **bows.js** - Bögen (Fernkampfwaffen)
- **armor.js** - Rüstungen (Defensive)
- **shields.js** - Schilde (Block-Defense)
- **accessories.js** - Accessoires (Schmuck, kleine Items)
- **itemRegistry.js** - Zentrale Verwaltung aller Items

## Item-Struktur

Jedes Item ist ein Objekt mit dieser Struktur:

```javascript
{
    // Identifikation
    id: "sword_1",                    // Unique ID, immer als "category_number"
    name: "Kurzschert",              // Angezeigter Name
    type: "sword",                   // Kategorie (tool, sword, bow, armor, shield, accessory)
    
    // UI & Verkauf
    icon: "🗡️",                      // Emoji-Icon
    price: 50,                       // Verkaufspreis in Gold
    inShop: true,                    // Verfügbar im Shop?
    desc: "Ein einfaches...",        // Kurze Beschreibung
    rarity: "common",                // Seltenheitsstufe
    
    // Anforderungen & Progression
    req: 1,                          // Level-Anforderung
    
    // Stats (spezifisch je Kategorie)
    damage: 8,                       // Für Waffen
    defense: 5,                      // Für Rüstung
    blockChance: 0.15,              // Für Schilde
    life: 10,                        // Allgemeine Stats
    
    // Drop-Quelle (Falls nicht im Shop)
    dropSources: ["fire_elementalist"],
    dropChance: 0.08,
    
    // Grid-Shape (für Inventar)
    body: [                          // 2D Array der Zellen
        [1, 1, 1],
        [0, 1, 0],
        [0, 1, 0]
    ],
    
    aura: [                          // Optionales Aura-Shape (größer als body)
        [1,1,1,1,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,1,1,1,1]
    ]
}
```

## Stats nach Kategorie

### Tools (Werkzeuge)
- `speedBonus` - Multiplikator für Abbaugeschwindigkeit (z.B. 1.05 = 5% schneller)

### Swords (Schwerter)
- `damage` - Basisschaden
- `attackSpeed` - Angriffsgeschwindigkeit (1.0 = normal, >1 = schneller)
- `physicalBonus` - Physischer Schadensbonus (1.2 = 20% mehr)
- `lifeLeech` - Lebensraub (0.05 = 5% des Schadens als Leben)
- `fireBonus`, `coldBonus`, `chainBonus` - Elementare Boni

### Bows (Bögen)
- `damage` - Basisschaden
- `attackSpeed` - Angriffsgeschwindigkeit
- `accuracy` - Genauigkeit (0.85 = 85% Trefferquote)
- `piercing` - Durchdringung (0.2 = 20%)
- `armorIgnore` - Rüstungsignorance
- `coldBonus` - Kältebonus

### Armor (Rüstungen)
- `defense` - Rüstungswert
- `evasion` - Ausweichbonus (-0.05 = 5% Penalty, 0.15 = 15% Bonus)
- `physicalReduction` - Physikalische Schadensreduktion
- `magicReduction` - Magische Schadensreduktion
- `durability` - Haltbarkeitsmultiplikator

### Shields (Schilde)
- `blockChance` - Blockchance (0.15 = 15%)
- `blockValue` - Blockierter Schaden
- `counterAttack` - Gegenschlagchance
- `magicAbsorption` - Magische Absorption
- `allDamageReduction` - Gesamtschadensreduktion

### Accessories (Accessoires)
- `life` - Zusätzliches Leben
- `mana` - Zusätzliches Mana
- `allResist` - Alle Resistenzen (0.08 = 8%)
- `lifeRegen` - Lebensregeneration pro Sekunde
- `willpower` - Willens-Bonus
- `critChance` - Critical-Hit-Chance
- `critMulti` - Critical-Multiplikator
- `damageBonus` - Allgemeiner Schadensbonus

## Raritätslevels

```
common    → Standard Items
magic     → Mit 1-2 Boni
rare      → Mit 3-4 Boni  
unique    → Spezielle Effekte
legendary → Ultimate Power
```

## Shape-System (Grid für Inventar)

Die `body` und `aura` are 2D Arrays, wobei:
- `1` = Zelle besetzt
- `0` = Leer

**Beispiel:**
```javascript
body: [
    [1, 1, 1],
    [0, 1, 0],
    [0, 1, 0]
]
```
Das ist eine Spitzhacke: 3x3 Zellen, nur die Mitte + unten entlang

## Wie man Stats anpasst

1. **Öffne die richtige Datei** (z.B. swords.js für Schwerter)
2. **Finde das Item** mit der gesuchten ID
3. **Ändere die Stat-Werte**
4. **Speichern und im Browser F5 + Speicher löschen**

Beispiel:
```javascript
// Before
damage: 8,

// After
damage: 15,  // 87.5% mehr Schaden!
```

## Um ein neues Item hinzuzufügen

1. Wähle die richtige Kategorie-Datei
2. Kopiere ein ähnliches Item
3. Ändere:
   - `id` (muss unique sein!)
   - `name`
   - `icon`
   - `price`
   - `req` (Level)
   - Die Stat-Werte
   - Optional: `body` und `aura` Shapes
4. Speichern

## Drop-Quellen

Items können aus Feinden droppen:

```javascript
dropSources: ["fire_elementalist", "lava_dragon"],
dropChance: 0.08,  // 8% Chance, wenn ein dieser Feinde besiegt wird
```

Wenn `inShop: true`, kann das Item auch gekauft werden (unabhängig von drops).

## Shape-Tipps

- `body` sollte kompakt sein (das echte Item-Shape)
- `aura` sollte größer sein (visueller Effekt)
- Größere Items = mehr Zellen = schwerer zu platzieren
- Größere Aura = mehr visueller Impact

---

**Hilfreiche Funktionen in itemRegistry.js:**
- `getItemById(id)` - Item einzeln abrufen
- `getItemsByType(type)` - Alle Items einer Kategorie
- `getItemsByRarity(rarity)` - Alle Items einer Seltenheit  
- `getShopItems()` - Alle shop-Items
- `initializeItemRegistry()` - Registry starten


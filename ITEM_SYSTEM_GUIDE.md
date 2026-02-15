# Item System Guide

## Overview

Item data is split by category files plus a central registry:

- `tools.js` - tools
- `swords.js` - swords
- `bows.js` - bows
- `armor.js` - armor
- `shields.js` - shields
- `accessories.js` - accessories
- `itemRegistry.js` - centralized registration and lookup

---

## Item shape model

Each item is described by source matrices:

- `body`: occupied shape for collision and placement
- `aura`: optional effect or visual area

Runtime systems may normalize or combine these internally, but source definitions should stay explicit and readable.

---

## Typical item structure

```javascript
{
  id: "sword_1",
  name: "Kurzschwert",
  type: "sword",

  icon: "<emoji or sprite>",
  price: 50,
  inShop: true,
  desc: "Ein einfaches Schwert",
  rarity: "common",
  req: 1,

  damage: 8,
  attackSpeed: 1.0,

  body: [
    [1, 1, 1],
    [0, 1, 0],
    [0, 1, 0]
  ],

  aura: [
    [1, 1, 1],
    [0, 1, 0],
    [0, 1, 0]
  ]
}
```

---

## Common stats by category

### Tools
- `speedBonus`

### Swords
- `damage`
- `attackSpeed`
- `physicalBonus`
- `lifeLeech`
- `fireBonus`, `coldBonus`, `chainBonus`

### Bows
- `damage`
- `attackSpeed`
- `accuracy`
- `piercing`
- `armorIgnore`
- `coldBonus`

### Armor
- `defense`
- `evasion`
- `physicalReduction`
- `magicReduction`
- `durability`

### Shields
- `blockChance`
- `blockValue`
- `counterAttack`
- `magicAbsorption`
- `allDamageReduction`

### Accessories
- `life`, `mana`
- `allResist`
- `lifeRegen`
- `willpower`
- `critChance`, `critMulti`
- `damageBonus`

---

## Rarity levels

- `common`
- `magic`
- `rare`
- `unique`
- `legendary`

---

## Editing workflow

1. Open the matching category file.
2. Locate item by `id`.
3. Update stats, shop flags, body and aura.
4. Reload game and verify placement plus preview behavior.

---

## New item checklist

- Unique `id`
- Clear `name`, `desc`, and `type`
- Balanced numeric stats
- Valid `body` matrix
- Optional `aura` matrix
- Correct `rarity` and `req`

---

## Useful registry helpers

- `getItemById(id)`
- `getItemsByType(type)`
- `getItemsByRarity(rarity)`
- `getShopItems()`
- `initializeItemRegistry()`

---

## Notes

- Keep body shapes compact for playability.
- Keep aura shapes readable and intentional.
- Validate rotation behavior for asymmetric items.

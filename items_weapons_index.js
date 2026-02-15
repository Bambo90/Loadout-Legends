/* ITEM FILE: Weapons Index
 * Aggregates concrete weapon item defs from prefix files.
 * ilvl/tier/roll ranges are handled upstream by affix/generator systems.
 */

const ITEMS_WEAPONS_ALL = [
    ...(typeof ITEMS_WEAPONS_SWORDS !== "undefined" ? ITEMS_WEAPONS_SWORDS : []),
    ...(typeof ITEMS_WEAPONS_AXES !== "undefined" ? ITEMS_WEAPONS_AXES : []),
    ...(typeof ITEMS_WEAPONS_MACES !== "undefined" ? ITEMS_WEAPONS_MACES : []),
    ...(typeof ITEMS_WEAPONS_DAGGERS !== "undefined" ? ITEMS_WEAPONS_DAGGERS : []),
    ...(typeof ITEMS_WEAPONS_SPEARS !== "undefined" ? ITEMS_WEAPONS_SPEARS : []),
    ...(typeof ITEMS_WEAPONS_BOWS !== "undefined" ? ITEMS_WEAPONS_BOWS : []),
    ...(typeof ITEMS_WEAPONS_CROSSBOWS !== "undefined" ? ITEMS_WEAPONS_CROSSBOWS : []),
    ...(typeof ITEMS_WEAPONS_WANDS !== "undefined" ? ITEMS_WEAPONS_WANDS : []),
    ...(typeof ITEMS_WEAPONS_STAVES !== "undefined" ? ITEMS_WEAPONS_STAVES : [])
];

if (typeof window !== "undefined") {
    window.ITEMS_WEAPONS_ALL = ITEMS_WEAPONS_ALL;
}

/* ITEM FILE: Consumables Index
 * Aggregates concrete consumable item defs from prefix files.
 * ilvl/tier/roll ranges are handled upstream by affix/generator systems.
 */

const ITEMS_CONSUMABLES_ALL = [
    ...(typeof ITEMS_CONSUMABLES_POTIONS !== "undefined" ? ITEMS_CONSUMABLES_POTIONS : [])
];

if (typeof window !== "undefined") {
    window.ITEMS_CONSUMABLES_ALL = ITEMS_CONSUMABLES_ALL;
}

/* ITEM FILE: Global Item Index
 * Central aggregator for all concrete item defs.
 * ilvl/tier/roll ranges are handled upstream by affix/generator systems.
 */

const ITEMS_ALL_DEFS = [
    ...(typeof ITEMS_WEAPONS_ALL !== "undefined" ? ITEMS_WEAPONS_ALL : []),
    ...(typeof ITEMS_OFFHANDS_ALL !== "undefined" ? ITEMS_OFFHANDS_ALL : []),
    ...(typeof ITEMS_ARMOR_ALL !== "undefined" ? ITEMS_ARMOR_ALL : []),
    ...(typeof ITEMS_ACCESSORIES_ALL !== "undefined" ? ITEMS_ACCESSORIES_ALL : []),
    ...(typeof ITEMS_ENHANCEMENTS_ALL !== "undefined" ? ITEMS_ENHANCEMENTS_ALL : []),
    ...(typeof ITEMS_CONSUMABLES_ALL !== "undefined" ? ITEMS_CONSUMABLES_ALL : [])
];

if (typeof window !== "undefined") {
    window.ITEMS_ALL_DEFS = ITEMS_ALL_DEFS;
}

/* ITEM FILE: Offhands Index
 * Aggregates concrete offhand item defs from prefix files.
 * ilvl/tier/roll ranges are handled upstream by affix/generator systems.
 */

const ITEMS_OFFHANDS_ALL = [
    ...(typeof ITEMS_OFFHANDS_SHIELDS !== "undefined" ? ITEMS_OFFHANDS_SHIELDS : [])
];

if (typeof window !== "undefined") {
    window.ITEMS_OFFHANDS_ALL = ITEMS_OFFHANDS_ALL;
}

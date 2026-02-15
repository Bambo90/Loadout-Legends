/* ITEM FILE: Accessories Index
 * Aggregates concrete accessory item defs from prefix files.
 * ilvl/tier/roll ranges are handled upstream by affix/generator systems.
 */

const ITEMS_ACCESSORIES_ALL = [
    ...(typeof ITEMS_ACCESSORIES_RINGS !== "undefined" ? ITEMS_ACCESSORIES_RINGS : []),
    ...(typeof ITEMS_ACCESSORIES_AMULETS !== "undefined" ? ITEMS_ACCESSORIES_AMULETS : [])
];

if (typeof window !== "undefined") {
    window.ITEMS_ACCESSORIES_ALL = ITEMS_ACCESSORIES_ALL;
}

/* ITEM FILE: Enhancements Index
 * Aggregates concrete enhancement item defs from prefix files.
 * ilvl/tier/roll ranges are handled upstream by affix/generator systems.
 */

const ITEMS_ENHANCEMENTS_ALL = [
    ...(typeof ITEMS_ENHANCEMENTS_WHETSTONES !== "undefined" ? ITEMS_ENHANCEMENTS_WHETSTONES : []),
    ...(typeof ITEMS_ENHANCEMENTS_GRIP_WRAPS !== "undefined" ? ITEMS_ENHANCEMENTS_GRIP_WRAPS : []),
    ...(typeof ITEMS_ENHANCEMENTS_GUARDS !== "undefined" ? ITEMS_ENHANCEMENTS_GUARDS : [])
];

if (typeof window !== "undefined") {
    window.ITEMS_ENHANCEMENTS_ALL = ITEMS_ENHANCEMENTS_ALL;
}

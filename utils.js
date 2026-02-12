// Utility helpers for grid layout
function getBankCols() {
    try {
        const workshopContent = document.querySelector('.workshop-content');
        const storageMode = (workshopContent && workshopContent.classList.contains('storage-mode')) || currentWorkshop === 'storage';
        // Keep bank at 10 columns in all modes for consistent layout
        return storageMode ? 10 : 10;
    } catch (err) {
        return 10;
    }
}

function getGridCols(gridKey) {
    if (gridKey === 'bank') return getBankCols();
    return typeof GRID_SIZE === 'number' ? GRID_SIZE : 10;
}

window.getBankCols = getBankCols;
window.getGridCols = getGridCols;

// Return runtime cell geometry (slot size + gap) for a given grid container.
// Compute runtime cell geometry for a grid container in a DPI-independent way.
// If `cols` is provided, use it to compute slot size from container.clientWidth.
function getCellGeometry(container, cols) {
    // Defaults
    let slotSize = 64;
    let gap = 8;
    try {
        // Prefer an explicit CSS variable `--slot-size` defined on :root or container
        try {
            const csRootElem = getComputedStyle(document.documentElement);
            const varRoot = csRootElem && csRootElem.getPropertyValue ? csRootElem.getPropertyValue('--slot-size') : null;
            if (varRoot) {
                const parsedRoot = parseFloat(varRoot);
                if (!isNaN(parsedRoot) && parsedRoot > 0) {
                    slotSize = parsedRoot;
                }
            } else {
                // try container-scoped variable
                const csContainer = getComputedStyle(container || document.documentElement);
                const varSlotLocal = csContainer && csContainer.getPropertyValue && csContainer.getPropertyValue('--slot-size');
                if (varSlotLocal) {
                    const parsed = parseFloat(varSlotLocal);
                    if (!isNaN(parsed) && parsed > 0) {
                        slotSize = parsed;
                    }
                } else {
                    // fallback: try any representative .grid-slot element
                    let el = container && container.querySelector && container.querySelector('.grid-slot');
                    if (!el) el = document.querySelector('.grid-slot');
                    if (el) {
                        const cs = getComputedStyle(el);
                        const w = parseFloat(cs.width) || slotSize;
                        const h = parseFloat(cs.height) || slotSize;
                        slotSize = (w + h) / 2; // fallback to average if needed
                    }
                }
            }
        } catch (e) {
            // ignore and continue to other fallbacks
        }
        // container gap
        if (container) {
            const cs2 = getComputedStyle(container);
            // modern browsers expose `gap`; fall back to columnGap/rowGap
            let g = null;
            if (cs2) g = parseFloat(cs2.gap) || parseFloat(cs2.columnGap) || parseFloat(cs2.rowGap) || null;
            if (g || g === 0) gap = g;

            // If cols provided, compute slotSize from container width to avoid DPI/rounding issues.
            if (typeof cols === 'number' && cols > 0) {
                const paddingLeft = parseFloat(cs2.paddingLeft) || 0;
                const paddingRight = parseFloat(cs2.paddingRight) || 0;
                const availableW = Math.max(0, container.clientWidth - paddingLeft - paddingRight - ((cols - 1) * gap));
                const computedSlot = availableW / cols;
                if (computedSlot > 4) {
                    // round to integer pixel to avoid subpixel tearing
                    slotSize = Math.round(computedSlot);
                }
            }
        } else {
            // also try document-level container gap if none provided
            const mainGrid = document.querySelector('.inventory-grid');
            if (mainGrid) {
                const cs3 = getComputedStyle(mainGrid);
                const g2 = cs3 && (parseFloat(cs3.gap) || parseFloat(cs3.columnGap) || parseFloat(cs3.rowGap)) || null;
                if (g2) gap = g2;
            }
        }
    } catch (err) {
        // ignore and use defaults
    }
    // defensive: if computed values are zero-ish, fall back to defaults and log for debugging
    if (!slotSize || slotSize <= 0) {
        slotSize = 64;
    }
    if (typeof gap !== 'number' || gap < 0) {
        gap = 8;
    }
    // canonicalize to integer pixels to avoid fractional layout tearing across monitors
    slotSize = Math.round(slotSize);
    gap = Math.round(gap);
    const cellW = slotSize + gap;
    const cellH = slotSize + gap;
    return { slotSize: slotSize, gap: gap, cellW: cellW, cellH: cellH };
}
window.getCellGeometry = getCellGeometry;

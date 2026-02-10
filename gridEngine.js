// ================================
// GRID ENGINE (Gridengine.js)
// Verwaltet echte Slot-Belegung
// ================================

// Global instance ID counter for unique item instances
let _instanceIdCounter = 1000;

function generateInstanceId() {
    return `inst_${++_instanceIdCounter}`;
}

function clearItemFromGrid(grid, idOrInstance) {
    if (!grid) return;
    const isInstance = typeof idOrInstance === 'string' && idOrInstance.startsWith('inst_');
    Object.keys(grid).forEach(k => {
        const cell = grid[k];
        if (!cell) return;
        if (isInstance && cell.instanceId === idOrInstance) {
            delete grid[k];
            return;
        }
        if (!isInstance && cell.itemId === idOrInstance) {
            delete grid[k];
        }
    });
}

function syncInstanceIdCounterFromGrids(grids) {
    let maxId = _instanceIdCounter;
    grids.forEach(grid => {
        if (!grid) return;
        Object.keys(grid).forEach(k => {
            const cell = grid[k];
            if (!cell || !cell.instanceId) return;
            const m = String(cell.instanceId).match(/inst_(\d+)/);
            if (m) {
                const num = parseInt(m[1], 10);
                if (!isNaN(num) && num > maxId) maxId = num;
            }
        });
    });
    _instanceIdCounter = maxId;
}

function canPlaceItem(grid, originIndex, shape, cols, maxRows) {
    // CRITICAL: shape parameter MUST be body only, never aura
    // Aura does NOT participate in collision/placement checks
    const originX = originIndex % cols;
    const originY = Math.floor(originIndex / cols);

    // Backpack Battles: Body must fit FULLY inside grid (no partial placement)
    // This ensures items are rendered completely within bounds
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[0].length; c++) {
            if (!shape[r][c]) continue; // Leeres Feld im Shape ignorieren

            const x = originX + c;
            const y = originY + r;

            // Check: Außerhalb der Grid-Grenzen? (must be fully inside)
            if (x < 0 || x >= cols || y < 0 || y >= maxRows) {
                if (window.DEBUG_PLACEMENT === true) {
                    console.log('      🚫 Cell [', r, ',', c, '] at grid pos (', x, ',', y, ') is OUT OF BOUNDS (cols=', cols, 'maxRows=', maxRows, ')');
                }
                return false;
            }

            // Check: Slot bereits belegt?
            const idx = y * cols + x;
            if (grid[idx]) {
                if (window.DEBUG_PLACEMENT === true) {
                    console.log('      🚫 Cell [', r, ',', c, '] at grid pos (', x, ',', y, ') is OCCUPIED by', grid[idx].itemId);
                }
                return false;
            }
        }
    }
    return true;
}

function placeItemIntoGrid(grid, originIndex, item, shape, cols, instanceId, maxRowsOverride) {
    // If no instanceId provided, generate a new one
    if (!instanceId) {
        instanceId = generateInstanceId();
    }

    // Determine max rows (needed for partial placement checks)
    let maxRows = maxRowsOverride;
    if (typeof maxRows === 'undefined' || maxRows === null) {
        // Bank has dynamic rows based on BANK_SLOTS and 6 columns
        if (cols === 6) {
            maxRows = Math.ceil(BANK_SLOTS / cols);
        } else {
            // Default grids use fixed GRID_ROWS
            maxRows = GRID_ROWS;
        }
    }

    const originX = originIndex % cols;
    const originY = Math.floor(originIndex / cols);
    const shapeCopy = shape.map(r => [...r]); // shape is body-only when placed

    // Find the first occupied cell to mark as root (handles leading empty rows/cols)
    let minR = Infinity;
    let minC = Infinity;
    for (let r = 0; r < shapeCopy.length; r++) {
        for (let c = 0; c < shapeCopy[0].length; c++) {
            if (!shapeCopy[r][c]) continue;
            if (r < minR) minR = r;
            if (c < minC) minC = c;
        }
    }

    console.log('📦 PLACE INTO GRID', { item: item.id, instance: instanceId, originIndex, originXY: { x: originX, y: originY }, shapeDim: { h: shapeCopy.length, w: shapeCopy[0].length }, shape: JSON.stringify(shapeCopy), minRC: { minR, minC } });

    if (minR === Infinity || minC === Infinity) {
        console.error('⚠️ WARNING: Shape is empty or all zeros! minR:', minR, 'minC:', minC);
        return instanceId;
    }

    // Root cell: first occupied cell (should always be in-bounds now)
    let rootPlaced = false;
    let rootSetTo = -1;

    shapeCopy.forEach((row, r) => {
        row.forEach((cell, c) => {
            if (!cell) return;
            const x = originX + c;
            const y = originY + r;
            const idx = y * cols + x;

            // Sanity check: should never be out of bounds if canPlaceItem passed
            if (x < 0 || x >= cols || y < 0 || y >= maxRows) {
                console.error('⚠️ Attempted to place cell outside grid! x=' + x + ' y=' + y + ' (this should not happen)');
                return;
            }

            const isRoot = !rootPlaced; // first occupied cell becomes root
            if (isRoot) {
                rootPlaced = true;
                rootSetTo = idx;
            }

            grid[idx] = {
                itemId: item.id,
                instanceId: instanceId,
                shape: shapeCopy,
                root: isRoot
            };

            if (isRoot) {
                console.log('  🟢 ROOT CELL at idx=' + idx + ' (r=' + r + ', c=' + c + ')');
            }
        });
    });

    console.log('📦 PLACE COMPLETE for instance ' + instanceId);
    return instanceId; // Return the instanceId for tracking
}
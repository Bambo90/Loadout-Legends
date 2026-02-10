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
    const originX = originIndex % cols;
    const originY = Math.floor(originIndex / cols);

    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[0].length; c++) {
            if (!shape[r][c]) continue; // Leeres Feld im Shape ignorieren

            const x = originX + c;
            const y = originY + r;

            // Check: Außerhalb der Grid-Grenzen?
            if (x < 0 || x >= cols || y < 0 || y >= maxRows) return false;

            // Check: Slot bereits belegt?
            const idx = y * cols + x;
            if (grid[idx]) return false;
        }
    }
    return true;
}

function placeItemIntoGrid(grid, originIndex, item, shape, cols, instanceId) {
    // If no instanceId provided, generate a new one
    if (!instanceId) {
        instanceId = generateInstanceId();
    }

    const originX = originIndex % cols;
    const originY = Math.floor(originIndex / cols);
    const shapeCopy = shape.map(r => [...r]);

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

    let hasRoot = false;
    shapeCopy.forEach((row, r) => {
        row.forEach((cell, c) => {
            if (!cell) return;
            const x = originX + c;
            const y = originY + r;
            const idx = y * cols + x;
            const isRoot = !hasRoot; // First occupied cell is root
            if (isRoot) hasRoot = true;

            grid[idx] = {
                itemId: item.id,
                instanceId: instanceId, // Unique instance identifier
                shape: shapeCopy, // Store a copy of the actual placed shape (may be rotated)
                root: isRoot // First occupied cell is the anchor
            };

            if (isRoot) {
                console.log('  🟢 ROOT CELL at idx=' + idx + ' (r=' + r + ', c=' + c + ')');
            }
        });
    });

    console.log('📦 PLACE COMPLETE for instance ' + instanceId);
    return instanceId; // Return the instanceId for tracking
}
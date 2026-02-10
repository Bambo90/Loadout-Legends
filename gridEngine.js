// ================================
// GRID ENGINE (Gridengine.js)
// Verwaltet echte Slot-Belegung
// ================================

// Global instance ID counter for unique item instances
let _instanceIdCounter = 1000;

function generateInstanceId() {
    return `inst_${++_instanceIdCounter}`;
}

function clearItemFromGrid(grid, instanceId) {
    Object.keys(grid).forEach(k => {
        if (grid[k]?.instanceId === instanceId) {
            delete grid[k];
        }
    });
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

    shape.forEach((row, r) => {
        row.forEach((cell, c) => {
            if (!cell) return;
            const x = originX + c;
            const y = originY + r;
            const idx = y * cols + x;

            grid[idx] = {
                itemId: item.id,
                instanceId: instanceId, // Unique instance identifier
                shape: shape.map(r => [...r]), // Store a copy of the actual placed shape (may be rotated)
                root: (r === 0 && c === 0) // Nur das erste Feld ist der Anker
            };
        });
    });
    
    return instanceId; // Return the instanceId for tracking
}
// ================================
// GRID ENGINE (Gridengine.js)
// Verwaltet echte Slot-Belegung
// ================================

function clearItemFromGrid(grid, itemId) {
    Object.keys(grid).forEach(k => {
        if (grid[k]?.itemId === itemId) {
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

function placeItemIntoGrid(grid, originIndex, item, shape, cols) {
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
                root: (r === 0 && c === 0) // Nur das erste Feld ist der Anker
            };
        });
    });
}
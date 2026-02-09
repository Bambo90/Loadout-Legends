// ================================
// DRAG ENGINE (Dragengine.js)
// Rotation + Drag State
// ================================

let draggedItem = null;

function rotateMatrixCW(matrix) {
    const h = matrix.length;
    const w = matrix[0].length;
    const res = Array.from({ length: w }, () => Array(h).fill(0));
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            res[x][h - 1 - y] = matrix[y][x];
        }
    }
    return res;
}

function initGlobalDragListeners() {
    // Rotation via 'R' Taste
    window.addEventListener('keydown', (e) => {
        if (!draggedItem || e.key.toLowerCase() !== 'r') return;
        
        e.preventDefault();
        draggedItem.previewShape = rotateMatrixCW(draggedItem.previewShape);
        
        // Offset mathematisch mitdrehen
        const oldX = draggedItem.offsetX;
        draggedItem.offsetX = (draggedItem.previewShape[0].length - 1) - draggedItem.offsetY;
        draggedItem.offsetY = oldX;
        
        // UI aktualisieren, um die neue Form im Grid anzuzeigen
        renderWorkshopGrids();
    });

    // Mausrad-Rotation
    window.addEventListener('wheel', (e) => {
        if (!draggedItem) return;
        e.preventDefault();
        // Logik wie oben für R-Taste
        draggedItem.previewShape = rotateMatrixCW(draggedItem.previewShape);
        const oldX = draggedItem.offsetX;
        draggedItem.offsetX = (draggedItem.previewShape[0].length - 1) - draggedItem.offsetY;
        draggedItem.offsetY = oldX;
        renderWorkshopGrids();
    }, { passive: false });
}
// ================================
// DRAG & DROP ENGINE (Dragdropengine.js)
// Handhabt das Ablegen mit Offset
// ================================

function handleDropInSlot(e) {
    e.preventDefault();
    if (!draggedItem) return;

    const slot = e.currentTarget;
    const location = slot.dataset.location;
    const targetIndex = parseInt(slot.dataset.index);
    const cols = parseInt(slot.dataset.cols);
    const maxRows = (location === 'bank') ? 6 : 5; // Beispiel für Grid-Höhen

    const grid = gameData[location];
    const shape = draggedItem.previewShape;

    // Grid-to-Grid Snapping: Berechne den echten Ursprungsslot (Top-Left)
    const mouseX = targetIndex % cols;
    const mouseY = Math.floor(targetIndex / cols);
    
    const originX = mouseX - draggedItem.offsetX;
    const originY = mouseY - draggedItem.offsetY;
    const finalOriginIndex = originY * cols + originX;

    // Validierung
    if (!canPlaceItem(grid, finalOriginIndex, shape, cols, maxRows)) {
        // Falls Platzierung ungültig, Item zurück an alte Position (oder Abbruch)
        renderWorkshopGrids();
        draggedItem = null;
        return;
    }

    // Platzieren
    placeItemIntoGrid(grid, finalOriginIndex, draggedItem.item, shape, cols);
    draggedItem = null;
    renderWorkshopGrids();
    saveGame();
}
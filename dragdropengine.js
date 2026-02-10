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
    
    // Calculate max rows based on location
    let maxRows = 5;
    if (location === 'bank') {
        maxRows = Math.ceil(BANK_SLOTS / cols);
    }

    const grid = gameData[location];
    if (!grid) {
        console.error("Grid not found for location:", location);
        // Restore item if drop location doesn't exist
        placeItemIntoGrid(gameData[draggedItem.fromLocation], draggedItem.fromIndex, draggedItem.item, draggedItem.previewShape, 
                         draggedItem.fromLocation === 'bank' ? 6 : GRID_SIZE);
        draggedItem = null;
        try { queueRenderWorkshopGrids(); } catch (err) { renderWorkshopGrids(); }
        return;
    }

    const shape = draggedItem.previewShape;

    // Grid-to-Grid Snapping: Berechne den echten Ursprungsslot (Top-Left)
    const mouseX = targetIndex % cols;
    const mouseY = Math.floor(targetIndex / cols);
    
    const originX = mouseX - draggedItem.offsetX;
    const originY = mouseY - draggedItem.offsetY;
    const finalOriginIndex = originY * cols + originX;

    // If placement invalid, try to find nearest valid origin within a small radius
    function tryFindNearestValid(grid, desiredOriginX, desiredOriginY, shape, cols, maxRows, radius) {
        const shapeW = shape[0].length;
        const shapeH = shape.length;
        for (let d = 0; d <= radius; d++) {
            for (let dx = -d; dx <= d; dx++) {
                for (let dy = -d; dy <= d; dy++) {
                    const ox = desiredOriginX + dx;
                    const oy = desiredOriginY + dy;
                    if (ox < 0 || oy < 0) continue;
                    if (ox + shapeW > cols) continue;
                    if (oy + shapeH > maxRows) continue;
                    const oidx = oy * cols + ox;
                    if (canPlaceItem(grid, oidx, shape, cols, maxRows)) return oidx;
                }
            }
        }
        return null;
    }

    console.log('drop attempt ->', { location, targetIndex, cols, mouseX, mouseY, originX, originY, finalOriginIndex });
    console.log('shape dims ->', { w: shape[0].length, h: shape.length });
    let canPlace = false;
    if (finalOriginIndex >= 0) {
        // quick occupancy snapshot for debugging
        const occ = [];
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[0].length; c++) {
                if (!shape[r][c]) continue;
                const px = originX + c;
                const py = originY + r;
                const pidx = py * cols + px;
                occ.push({ r, c, px, py, idx: pidx, occupied: !!grid[pidx] });
            }
        }
        console.log('placement occupancy check', occ);
        canPlace = canPlaceItem(grid, finalOriginIndex, shape, cols, maxRows );
    }
    console.log('canPlace check ->', canPlace, 'originIndex', finalOriginIndex);

    // If not directly placeable, try to find a nearby valid spot (radius 2)
    let chosenIndex = finalOriginIndex;
    if (!canPlace) {
        const desiredX = originX;
        const desiredY = originY;
        const found = tryFindNearestValid(grid, desiredX, desiredY, shape, cols, maxRows, 2);
        if (found !== null) {
            console.log('Found nearby valid placement at', found);
            chosenIndex = found;
            canPlace = true;
        }
    }

    // Validierung - Falls ungültig, Item zurück an ursprüngliche Position
    if (chosenIndex < 0 || !canPlace) {
        console.log("Invalid placement, restoring item to original location");
        // Put item back where it came from
        const fromCols = draggedItem.fromLocation === 'bank' ? 6 : GRID_SIZE;
        placeItemIntoGrid(gameData[draggedItem.fromLocation], draggedItem.fromIndex, draggedItem.item, draggedItem.previewShape, fromCols);
        draggedItem = null;
        try { queueRenderWorkshopGrids(); } catch (err) { renderWorkshopGrids(); }
        return;
    }

    // Platzieren
    placeItemIntoGrid(grid, chosenIndex, draggedItem.item, shape, cols);
    console.log('placed item ->', draggedItem.item.id, 'at', location, 'index', chosenIndex);
    draggedItem = null;
    try { queueRenderWorkshopGrids(); } catch (err) { renderWorkshopGrids(); }
    
    if (typeof saveGame === 'function') {
        saveGame();
    }
}
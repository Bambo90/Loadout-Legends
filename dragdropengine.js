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
        placeItemIntoGrid(
            gameData[draggedItem.fromLocation],
            draggedItem.fromIndex,
            draggedItem.item,
            draggedItem.previewShape,
            draggedItem.fromLocation === 'bank' ? 6 : GRID_SIZE,
            draggedItem.instanceId
        );
        draggedItem = null;
        try { queueRenderWorkshopGrids(); } catch (err) { renderWorkshopGrids(); }
        return;
    }

    const shape = draggedItem.previewShape;

    // Grid-to-Grid Snapping: Berechne den echten Ursprungsslot (Top-Left)
    // If moving to a different grid, reset offset to safe default
    let adjustedOffsetX = draggedItem.offsetX;
    let adjustedOffsetY = draggedItem.offsetY;
    
    if (location !== draggedItem.fromLocation) {
        // Cross-grid move: use center of item as anchor
        adjustedOffsetX = Math.floor(shape[0].length / 2);
        adjustedOffsetY = Math.floor(shape.length / 2);
    }
    
    const mouseX = targetIndex % cols;
    const mouseY = Math.floor(targetIndex / cols);
    
    const originX = mouseX - adjustedOffsetX;
    const originY = mouseY - adjustedOffsetY;
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

    console.log('🔷 DROP ATTEMPT ->', { location, targetIndex, cols, originXY: { x: originX, y: originY }, finalOriginIndex, shapeDim: { h: shape.length, w: shape[0].length }, shape: JSON.stringify(shape), offset: {x: adjustedOffsetX, y: adjustedOffsetY} });
    let canPlace = false;
    if (finalOriginIndex >= 0) {
        canPlace = canPlaceItem(grid, finalOriginIndex, shape, cols, maxRows);
    }
    console.log('  📍 CAN PLACE:', canPlace, '| fromInstance:', draggedItem.instanceId, '| to:', location, 'index:', finalOriginIndex);

    // If not directly placeable, try to find a nearby valid spot (radius 2)
    // But ONLY if the origin itself is inside or VERY close to the grid
    let chosenIndex = finalOriginIndex;
    if (!canPlace) {
        const desiredX = originX;
        const desiredY = originY;
        const shapeW = shape[0].length;
        const shapeH = shape.length;
        
        // Stricter check: Item bounds must be within 1 cell of grid
        // Left: origin >= -1, Right: origin + width <= cols + 1
        // Top: origin >= -1, Bottom: origin + height <= maxRows + 1
        const insideOrNearby = (desiredX >= -1) && (desiredX + shapeW <= cols + 1) &&
                               (desiredY >= -1) && (desiredY + shapeH <= maxRows + 1);
        
        if (insideOrNearby) {
            const found = tryFindNearestValid(grid, desiredX, desiredY, shape, cols, maxRows, 2);
            if (found !== null) {
                console.log('Found nearby valid placement at', found);
                chosenIndex = found;
                canPlace = true;
            }
        } else {
            console.log('✋ DROPPED TOO FAR OUTSIDE - no radius search. desiredXY:', {desiredX, desiredY}, 'shapeDim:', {shapeW, shapeH}, 'bounds:', {cols, maxRows});
        }
    }

    // Validierung - Falls ungültig, Item zurück an ursprüngliche Position
    if (chosenIndex < 0 || !canPlace) {
        console.log("Invalid placement, restoring item to original location");
        // Put item back where it came from
        const fromCols = draggedItem.fromLocation === 'bank' ? 6 : GRID_SIZE;
        placeItemIntoGrid(
            gameData[draggedItem.fromLocation],
            draggedItem.fromIndex,
            draggedItem.item,
            draggedItem.previewShape,
            fromCols,
            draggedItem.instanceId
        );
        draggedItem = null;
        try { queueRenderWorkshopGrids(); } catch (err) { renderWorkshopGrids(); }
        return;
    }

    // Platzieren
    placeItemIntoGrid(grid, chosenIndex, draggedItem.item, shape, cols, draggedItem.instanceId);
    console.log('✅ PLACED ITEM', { itemId: draggedItem.item.id, instance: draggedItem.instanceId, location, index: chosenIndex });
    draggedItem = null;
    try { queueRenderWorkshopGrids(); } catch (err) { renderWorkshopGrids(); }
    
    if (typeof saveGame === 'function') {
        saveGame();
    }
}
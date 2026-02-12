// ================================
// DRAG & DROP ENGINE (Dragdropengine.js)
// Handhabt das Ablegen mit Offset
// ================================

function handleDropInSlot(e) {
    e.preventDefault();
    const draggedItem = DragSystem.getDraggedItem();
    if (!draggedItem) return;

    const slot = e.currentTarget;
    const location = slot.dataset.location;
    const targetIndex = parseInt(slot.dataset.index);
    const cols = parseInt(slot.dataset.cols);
    
    // Calculate max rows based on location
    let maxRows = GRID_ROWS;
    if (location === 'bank') {
        maxRows = Math.ceil(BANK_SLOTS / cols);
    }

    const grid = gameData[location];
    if (!grid) {
        console.error("Grid not found for location:", location);
        // Restore item if drop location doesn't exist
        const restoreShape = (typeof getItemBodyMatrix === 'function')
            ? getItemBodyMatrix(draggedItem.item, draggedItem.rotationIndex || 0)
            : (draggedItem.item?.body || draggedItem.previewShape);
        const fallbackFromCols = draggedItem && draggedItem.fromCols ? draggedItem.fromCols : (draggedItem && draggedItem.fromLocation === 'bank' ? ((document.querySelector('.workshop-content') && document.querySelector('.workshop-content').classList.contains('storage-mode')) || currentWorkshop === 'storage' ? 10 : 6) : GRID_SIZE);
        placeItemIntoGrid(
            gameData[draggedItem.fromLocation],
            draggedItem.fromIndex,
            draggedItem.item,
            restoreShape,
            fallbackFromCols,
            draggedItem.instanceId,
            null,
            draggedItem.rotatedAura || null,
            draggedItem.rotationIndex
        );
        DragSystem.clearDraggedItem();
        try { queueRenderWorkshopGrids(); } catch (err) { renderWorkshopGrids(); }
        return;
    }

    // previewShape is ALWAYS body (set in customDrag.js)
    // Aura is never involved in placement logic
    const bodyShape = draggedItem.previewShape;
    const bodyW = bodyShape[0] ? bodyShape[0].length : 1;
    const bodyH = bodyShape.length;

    const item = draggedItem.item;

    // Grid-to-Grid Snapping: Berechne den echten Ursprungsslot (Top-Left)
    // If moving to a different grid, reset offset to safe default
    let adjustedOffsetX = draggedItem.offsetX;
    let adjustedOffsetY = draggedItem.offsetY;
    
    if (location !== draggedItem.fromLocation) {
        // Cross-grid move: use center of item as anchor
        adjustedOffsetX = Math.floor(bodyW / 2);
        adjustedOffsetY = Math.floor(bodyH / 2);
    }
    
    const mouseX = targetIndex % cols;
    const mouseY = Math.floor(targetIndex / cols);
    
    const originX = mouseX - adjustedOffsetX;
    const originY = mouseY - adjustedOffsetY;
    const finalOriginIndex = originY * cols + originX;
    
    console.log('🔷 DROP ATTEMPT ->', { 
        location, targetIndex, cols, maxRows,
        bodyShape: JSON.stringify(bodyShape),
        bodyDim: { h: bodyH, w: bodyW },
        bodyDim: { h: bodyH, w: bodyW },
        adjustedOffset: { x: adjustedOffsetX, y: adjustedOffsetY },
        originXY: { x: originX, y: originY },
        finalOriginIndex,
        rightEdge: originX + bodyW,
        bottomEdge: originY + bodyH,
        crossGrid: location !== draggedItem.fromLocation
    });
    
    console.log('  📌 Grid bounds: cols=', cols, 'maxRows=', maxRows, '| Body would occupy X:', originX, 'to', originX + bodyW - 1, '| Y:', originY, 'to', originY + bodyH - 1);

    // Helper: Check if body has ANY overlap with grid (not "fully inside")
    // Backpack Battles: Body only needs 1 cell touching grid, can partially extend outside
    function hasBodyOverlapWithGrid(bodyShape, originX, originY, cols, maxRows) {
        const bodyW = bodyShape[0] ? bodyShape[0].length : 1;
        const bodyH = bodyShape.length;
        
        for (let r = 0; r < bodyH; r++) {
            for (let c = 0; c < bodyW; c++) {
                if (!bodyShape[r][c]) continue; // Skip empty cells in shape
                const x = originX + c;
                const y = originY + r;
                // Check if this cell is within grid bounds
                if (x >= 0 && x < cols && y >= 0 && y < maxRows) {
                    return true; // At least 1 cell touches grid
                }
            }
        }
        return false; // No part of body touches grid = fully outside
    }

    // Helper: Check if body placement is valid (no collisions, correct boundaries)
    function tryFindNearestValid(grid, desiredOriginX, desiredOriginY, bodyShape, cols, maxRows, radius) {
        const bodyW = bodyShape[0] ? bodyShape[0].length : 1;
        const bodyH = bodyShape.length;
        for (let d = 0; d <= radius; d++) {
            for (let dx = -d; dx <= d; dx++) {
                for (let dy = -d; dy <= d; dy++) {
                    const ox = desiredOriginX + dx;
                    const oy = desiredOriginY + dy;
                    // Skip candidates with no body overlap (prevents picking placements fully off-grid)
                    if (!hasBodyOverlapWithGrid(bodyShape, ox, oy, cols, maxRows)) continue;
                    const oidx = oy * cols + ox;
                    if (canPlaceItem(grid, oidx, bodyShape, cols, maxRows)) return oidx;
                }
            }
        }
        return null;
    }

    // BACKPACK BATTLES LOGIC:
    // 1. If body has NO overlap with grid at all → Snap back immediately
    // 2. If body has overlap but placement invalid → Try radius search
    // 3. If overlap but no valid placement found → Snap back
    const hasOverlap = hasBodyOverlapWithGrid(bodyShape, originX, originY, cols, maxRows);
    
    console.log('  🔍 Body overlap check:', hasOverlap ? '✅ HAS OVERLAP' : '❌ NO OVERLAP (completely outside)');
    
    if (!hasOverlap) {
        console.log('❌ BODY COMPLETELY OUTSIDE GRID (no overlap) - snapping back to Storage');
        const fromCols = draggedItem && draggedItem.fromCols ? draggedItem.fromCols : (draggedItem && draggedItem.fromLocation === 'bank' ? ((document.querySelector('.workshop-content') && document.querySelector('.workshop-content').classList.contains('storage-mode')) || currentWorkshop === 'storage' ? 10 : 6) : GRID_SIZE);
        placeItemIntoGrid(
            gameData[draggedItem.fromLocation],
            draggedItem.fromIndex,
            draggedItem.item,
            bodyShape,
            fromCols,
            draggedItem.instanceId,
            null,
            draggedItem.rotatedAura || null,
            draggedItem.rotationIndex
        );
        DragSystem.clearDraggedItem();
        try { queueRenderWorkshopGrids(); } catch (err) { renderWorkshopGrids(); }
        return;
    }

    // FIRST: Try direct placement (body must be fully inside and collision-free)
    let canPlace = canPlaceItem(grid, finalOriginIndex, bodyShape, cols, maxRows);
    console.log('  📍 Direct placement at origin index', finalOriginIndex, ':', canPlace ? '✅ VALID' : '❌ INVALID');
    
    if (!canPlace) {
        console.log('    ⚠️ Reason: Body does not fit fully in grid or collision detected');
    }

    let chosenIndex = finalOriginIndex;
    
    // SECOND: If direct placement fails BUT body overlaps grid, search for nearby valid spot
    // This allows partial placement like Backpack Battles
    if (!canPlace) {
        const searchRadius = location !== draggedItem.fromLocation ? 4 : 2;
        console.log('  🔍 Searching for valid placement within radius', searchRadius, '(cross-grid:', location !== draggedItem.fromLocation, ')');
        let searchAttempts = 0;
        let skippedNoOverlap = 0;
        
        // Log original function to count attempts
        const originalTryFindNearestValid = tryFindNearestValid;
        const found = (() => {
            const bodyW = bodyShape[0] ? bodyShape[0].length : 1;
            const bodyH = bodyShape.length;
            for (let d = 0; d <= searchRadius; d++) {
                for (let dx = -searchRadius; dx <= searchRadius; dx++) {
                    for (let dy = -searchRadius; dy <= searchRadius; dy++) {
                        if (Math.abs(dx) > d && Math.abs(dy) > d) continue; // Skip diagonal corners beyond current radius
                        const ox = originX + dx;
                        const oy = originY + dy;
                        searchAttempts++;
                        
                        // Skip candidates with no body overlap (prevents picking placements fully off-grid)
                        if (!hasBodyOverlapWithGrid(bodyShape, ox, oy, cols, maxRows)) {
                            skippedNoOverlap++;
                            continue;
                        }
                        
                        const oidx = oy * cols + ox;
                        if (canPlaceItem(grid, oidx, bodyShape, cols, maxRows)) {
                            console.log('    ✅ Found valid at offset (dx=', dx, 'dy=', dy, ') → originXY (', ox, ',', oy, ') index=', oidx);
                            return oidx;
                        }
                    }
                }
            }
            return null;
        })();
        
        console.log('    📊 Search stats: attempts=', searchAttempts, 'skipped(no overlap)=', skippedNoOverlap);
        
        if (found !== null) {
            console.log('  ✅ Found valid placement at index', found, 'within radius', searchRadius);
            chosenIndex = found;
            canPlace = true;
        } else {
            console.log('  ✋ No valid placement found even with radius search');
        }
    }

    // VALIDATION: If still invalid, snap back to original location
    if (!canPlace) {
        console.log("❌ Drop FAILED - restoring item to original location (no valid placement found)");
        const fromCols = draggedItem && draggedItem.fromCols ? draggedItem.fromCols : (draggedItem && draggedItem.fromLocation === 'bank' ? ((document.querySelector('.workshop-content') && document.querySelector('.workshop-content').classList.contains('storage-mode')) || currentWorkshop === 'storage' ? 10 : 6) : GRID_SIZE);
        placeItemIntoGrid(
            gameData[draggedItem.fromLocation],
            draggedItem.fromIndex,
            draggedItem.item,
            bodyShape,
            fromCols,
            draggedItem.instanceId,
            null,
            draggedItem.rotatedAura || null,
            draggedItem.rotationIndex
        );
        DragSystem.clearDraggedItem();
        try { queueRenderWorkshopGrids(); } catch (err) { renderWorkshopGrids(); }
        return;
    }

    // Platzieren
    // Store ONLY the body in grid to avoid aura blocking placements/edges
    placeItemIntoGrid(
        grid,
        chosenIndex,
        draggedItem.item,
        bodyShape,
        cols,
        draggedItem.instanceId,
        null,
        draggedItem.rotatedAura || null,
        draggedItem.rotationIndex
    );
    console.log('✅ PLACED ITEM', { itemId: draggedItem.item.id, instance: draggedItem.instanceId, location, index: chosenIndex });
    DragSystem.clearDraggedItem();
    try { queueRenderWorkshopGrids(); } catch (err) { renderWorkshopGrids(); }
    
    if (typeof saveGame === 'function') {
        saveGame();
    }
}
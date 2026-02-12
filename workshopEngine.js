// ==========================================
// WORKSHOP ENGINE
// Handles workshop grid rendering & updates
// ==========================================

/**
 * Creates a single grid slot and renders items if present
 */
function createSlot(container, location, index, cols) {
    const slot = document.createElement('div');
    slot.classList.add('grid-slot');
    slot.dataset.location = location;
    slot.dataset.index = index;
    slot.dataset.cols = cols;

    slot.addEventListener('dragover', (e) => {
        e.preventDefault();
        try { if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'; } catch (err) {}
    });
    slot.addEventListener('dragenter', (e) => {
        slot.classList.add('drag-over');
    });
    slot.addEventListener('dragleave', (e) => {
        slot.classList.remove('drag-over');
    });
    slot.addEventListener('drop', handleDropInSlot);
    // Hover target to improve drag responsiveness
    slot.addEventListener('mouseenter', () => {
        if (draggedItem) {
            draggedItem.hoverTarget = { location, index };
            try { queueRenderWorkshopGrids(); } catch (err) { renderWorkshopGrids(); }
        }
    });
    slot.addEventListener('mouseleave', () => {
        if (draggedItem && draggedItem.hoverTarget && draggedItem.hoverTarget.location === location && draggedItem.hoverTarget.index === index) {
            delete draggedItem.hoverTarget;
            try { queueRenderWorkshopGrids(); } catch (err) { renderWorkshopGrids(); }
        }
    });

    // Stelle sicher, dass das Grid existiert
    if (!gameData[location]) {
        gameData[location] = {};
    }

    const grid = gameData[location];
    const cell = grid[index];

    // (debug logging removed)

    // Falls Slot leer oder kein Anker (Root), nur leeren Slot rendern
    if (!cell) {
        container.appendChild(slot);
        return;
    }
    if (!cell.root) {
        console.log('⏭️  SKIP RENDER (no root) at index=' + index + ', cell has itemId=' + cell.itemId + ', instanceId=' + cell.instanceId);
        container.appendChild(slot);
        return;
    }

    const item = getItemById(cell.itemId);
    if (!item) {
        container.appendChild(slot);
        return;
    }

    const rotationIndex = (draggedItem && draggedItem.instanceId === cell.instanceId && typeof draggedItem.rotationIndex === 'number')
        ? draggedItem.rotationIndex
        : (typeof cell.rotationIndex === 'number' ? cell.rotationIndex : 0);

    // Always use body shape for placement (never aura)
    const shape = (typeof getItemBodyMatrix === 'function')
        ? getItemBodyMatrix(item, rotationIndex)
        : (item.body || [[1]]);
    if (!shape || !Array.isArray(shape) || shape.length === 0) {
        container.appendChild(slot);
        return;
    }

    const rows = shape.length;
    const colsShape = shape[0] ? shape[0].length : 1;

    const itemEl = document.createElement('div');
    itemEl.classList.add('item', item.rarity);
    itemEl.draggable = false;
    // expose metadata for pointer-based drag
    itemEl.dataset.itemId = item.id;
    itemEl.dataset.fromLocation = location;
    itemEl.dataset.fromIndex = index;

    // Dimensionen berechnen basierend auf Laufzeit-Grid-Geometrie
    const geo = (typeof getCellGeometry === 'function') ? getCellGeometry(container, cols) : { slotSize: 64, gap: 8, cellW: 72, cellH: 72 };
    const slotSize = geo.slotSize;
    const gap = geo.gap;
    itemEl.style.width = ((colsShape * slotSize) + ((colsShape - 1) * gap)) + "px";
    itemEl.style.height = ((rows * slotSize) + ((rows - 1) * gap)) + "px";
    itemEl.style.display = "grid";
    itemEl.style.gridTemplateColumns = `repeat(${colsShape}, ${slotSize}px)`;
    itemEl.style.gridTemplateRows = `repeat(${rows}, ${slotSize}px)`;
    itemEl.style.gap = `${gap}px`;
    itemEl.style.zIndex = "100";

    shape.forEach((row, r) => {
        if (!Array.isArray(row)) return;
        row.forEach((cellValue, c) => {
            const pixel = document.createElement('div');
            pixel.dataset.offsetX = c;
            pixel.dataset.offsetY = r;
            
            // WICHTIG: Hier wird die Klasse für den Glow vergeben
            if (cellValue === 1) {
                pixel.classList.add('shape-block', item.rarity);
            } else {
                pixel.classList.add('shape-empty');
            }
            itemEl.appendChild(pixel);
        });
    });

    // Prefer sprite image overlay when available, centered above the body.
    if (item.sprite || item.image) {
        const img = document.createElement('img');
        img.src = item.sprite || item.image;
        img.alt = item.name || '';
        img.classList.add('item-sprite');
        img.style.position = 'absolute';
        img.style.left = '50%';
        img.style.top = '50%';
        img.style.transform = 'translate(-50%, -50%)';
        img.style.maxWidth = '90%';
        img.style.maxHeight = '90%';
        img.style.pointerEvents = 'none';
        img.style.zIndex = '110';
        itemEl.appendChild(img);
    } else {
        const icon = document.createElement('div');
        icon.classList.add('item-icon-overlay');
        icon.innerText = item.icon;
        icon.style.pointerEvents = "none";
        itemEl.appendChild(icon);
    }

    // ===== STORAGE SYSTEM INTEGRATION =====
    // Apply lock/selection visual states if storageEngine is initialized
    if (typeof storageState !== 'undefined' && cell.instanceId) {
        // Add lock icon if item is locked
        if (storageState.lockedItems.has(cell.instanceId)) {
            itemEl.classList.add('item-locked');
        }
        
        // Add selection border if item is selected for bulk sell
        if (storageState.selectedItems.has(cell.instanceId)) {
            itemEl.classList.add('item-selected');
        }
    }
    
    // Right-click handler for item locking (works in all workshop modes)
    itemEl.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (typeof toggleItemLock === 'function' && cell.instanceId) {
            toggleItemLock(cell.instanceId);
            // Re-render to show lock icon immediately
            if (typeof renderWorkshopGrids === 'function') {
                renderWorkshopGrids();
            }
        }
    });
    
    // Click handler for bulk-sell selection (only active when bulk sell mode enabled)
    itemEl.addEventListener('click', (e) => {
        // Only handle clicks when bulk sell mode is active
        if (typeof storageState !== 'undefined' && storageState.bulkSellMode && cell.instanceId) {
            e.preventDefault();
            e.stopPropagation();
            
            if (typeof toggleItemSelection === 'function') {
                toggleItemSelection(cell.instanceId);
                // Re-render to show selection border immediately
                if (typeof renderWorkshopGrids === 'function') {
                    renderWorkshopGrids();
                }
            }
        }
    });

    // ===== AURA OVERLAY (Hidden by default) =====
    const auraOverlay = document.createElement('div');
    auraOverlay.classList.add('aura-overlay', item.rarity);
    auraOverlay.style.position = 'absolute';
    auraOverlay.style.opacity = '0';
    auraOverlay.style.transition = 'opacity 0.15s ease';
    auraOverlay.style.pointerEvents = 'none';
    auraOverlay.style.zIndex = '50';
    
    // Priority: 1) draggedItem rotatedAura (during drag), 2) stored rotatedAura, 3) helper-derived aura
    let aura = null;
    let useBodyBoundsForAura = true;
    if (draggedItem && draggedItem.instanceId === cell.instanceId && draggedItem.rotatedAura) {
        aura = draggedItem.rotatedAura;
        console.log('  🔄 Using rotated aura for drag preview:', JSON.stringify(aura));
    } else if (cell.rotatedAura) {
        aura = cell.rotatedAura;
        console.log('  🔄 Using stored rotated aura from grid:', JSON.stringify(aura));
    } else if (typeof getItemAuraMatrix === 'function') {
        aura = getItemAuraMatrix(item, rotationIndex);
    }
    if (!aura) {
        aura = [[1,1,1], [1,0,1], [1,1,1]];
        useBodyBoundsForAura = false;
    }
    
    const auraRows = aura.length;
    const auraColsShape = aura[0] ? aura[0].length : 1;
    
    const auraWidth = ((auraColsShape * slotSize) + ((auraColsShape - 1) * gap));
    const auraHeight = ((auraRows * slotSize) + ((auraRows - 1) * gap));
    auraOverlay.style.width = auraWidth + "px";
    auraOverlay.style.height = auraHeight + "px";
    auraOverlay.style.display = "grid";
    auraOverlay.style.gridTemplateColumns = `repeat(${auraColsShape}, ${slotSize}px)`;
    auraOverlay.style.gridTemplateRows = `repeat(${auraRows}, ${slotSize}px)`;
    auraOverlay.style.gap = `${gap}px`;
    
    const bodyBounds = (typeof getItemBodyBounds === 'function')
        ? getItemBodyBounds(item, rotationIndex)
        : { minR: 0, minC: 0 };
    const tileSize = geo.cellW;
    if (useBodyBoundsForAura) {
        auraOverlay.style.left = (-bodyBounds.minC * tileSize) + "px";
        auraOverlay.style.top = (-bodyBounds.minR * tileSize) + "px";
    } else {
        const offsetX = (colsShape - auraColsShape) / 2 * tileSize;
        const offsetY = (rows - auraRows) / 2 * tileSize;
        auraOverlay.style.left = offsetX + "px";
        auraOverlay.style.top = offsetY + "px";
    }
    
    // Calculate item position in grid to check aura bounds
    const itemGridX = index % cols;
    const itemGridY = Math.floor(index / cols);
    
    // Calculate max rows for boundary checking
    let maxRows = GRID_ROWS; // Default
    if (location === 'bank') {
        maxRows = Math.ceil(BANK_SLOTS / cols);
    }
    
    aura.forEach((row, r) => {
        if (!Array.isArray(row)) return;
        row.forEach((cellValue, c) => {
            const auraCell = document.createElement('div');
            auraCell.style.width = `${slotSize}px`;
            auraCell.style.height = `${slotSize}px`;
            
            // Calculate absolute grid position of this aura cell
            const auraGridX = useBodyBoundsForAura
                ? itemGridX + (c - bodyBounds.minC)
                : itemGridX + c - Math.floor(auraColsShape / 2);
            const auraGridY = useBodyBoundsForAura
                ? itemGridY + (r - bodyBounds.minR)
                : itemGridY + r - Math.floor(auraRows / 2);
            
            // Check if aura cell is outside grid boundaries
            const isOutOfBounds = (auraGridX < 0 || auraGridX >= cols || auraGridY < 0 || auraGridY >= maxRows);
            
            if (cellValue === 1 && !isOutOfBounds) {
                auraCell.classList.add('aura-cell', 'active');
                auraCell.style.backgroundColor = 'rgba(100, 200, 255, 0.3)';
                auraCell.style.border = '2px solid rgba(100, 200, 255, 0.6)';
            } else {
                // Either empty cell or out of bounds - make it transparent/invisible
                auraCell.classList.add('aura-cell', 'empty');
                auraCell.style.backgroundColor = 'transparent';
                auraCell.style.border = 'none';
            }
            auraCell.style.borderRadius = '4px';
            auraOverlay.appendChild(auraCell);
        });
    });
    
    itemEl.appendChild(auraOverlay);
    itemEl.style.position = 'relative';

    // ===== EVENT LISTENER FÜR AURA DISPLAY =====
    itemEl.addEventListener('mouseenter', () => {
        if (!window.altKeyPressed) { // Nur bei Hover wenn Alt nicht bereits aktiv
            auraOverlay.style.opacity = '1';
        }
    });
    
    itemEl.addEventListener('mouseleave', () => {
        if (!window.altKeyPressed) { // Ausblenden nur wenn Alt nicht aktiv
            auraOverlay.style.opacity = '0';
        }
    });

    // Pointer-based drag start (uses customDrag.startCustomDrag)
    itemEl.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        const rect = itemEl.getBoundingClientRect();
        const tileW = geo.cellW;
        const tileH = geo.cellH;
        const cx = (e.clientX && e.clientX !== 0) ? e.clientX : (rect.left + rect.width / 2);
        const cy = (e.clientY && e.clientY !== 0) ? e.clientY : (rect.top + rect.height / 2);
        let relX = cx - rect.left;
        let relY = cy - rect.top;
        let calcOffsetX = Math.floor(relX / tileW);
        let calcOffsetY = Math.floor(relY / tileH);
        if (isNaN(calcOffsetX) || calcOffsetX < 0) calcOffsetX = 0;
        if (isNaN(calcOffsetY) || calcOffsetY < 0) calcOffsetY = 0;
        calcOffsetX = Math.min(calcOffsetX, colsShape - 1);
        calcOffsetY = Math.min(calcOffsetY, rows - 1);

        // Start the custom pointer drag with instanceId from grid cell
        if (typeof window.startCustomDrag === 'function') {
            // Pass a COPY of the shape to avoid modifying the grid cell during rotation
            const shapeCopy = shape.map(r => [...r]);
            
            // Show auras during drag
            if (typeof showAllAuras === 'function') {
                showAllAuras();
            }
            
            // Pass cell.rotatedAura to preserve rotation when picking up item
            window.startCustomDrag(item, location, index, calcOffsetX, calcOffsetY, shapeCopy, itemEl, e, cell.instanceId, cell.rotatedAura, rotationIndex);
        }
    });

    slot.appendChild(itemEl);
    container.appendChild(slot);
}

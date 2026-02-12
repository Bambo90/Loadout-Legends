// customDrag.js
// Pointer-based drag & drop replacement to avoid native drag inconsistencies.

let _customFollowEl = null;
let _customPointerMove = null;
let _customPointerUp = null;

function _getGridSlotFromPoint(clientX, clientY) {
    const bankGrid = document.getElementById('bank-grid');
    const activeGrid = document.getElementById('active-setup-grid');
    if (!bankGrid || !activeGrid) return null;

    // Use runtime geometry so hit-testing matches actual grid CSS
    const activeGeo = activeGrid ? getCellGeometry(activeGrid, GRID_SIZE) : { cellW: 72, cellH: 72 };
    const bankColsForGeo = (typeof getBankCols === 'function') ? getBankCols() : 6;
    const bankGeo = bankGrid ? getCellGeometry(bankGrid, bankColsForGeo) : { cellW: 72, cellH: 72 };
    const cellW = activeGeo.cellW;
    const cellH = activeGeo.cellH;

    // Active grid (farm/pve)
    const activeRect = activeGrid.getBoundingClientRect();
    if (clientX >= activeRect.left && clientX <= activeRect.right && clientY >= activeRect.top && clientY <= activeRect.bottom) {
        const relX = clientX - activeRect.left;
        const relY = clientY - activeRect.top;
        const col = Math.floor(relX / cellW);
        const row = Math.floor(relY / cellH);
        const maxRows = GRID_ROWS;
        const clampedCol = Math.max(0, Math.min(GRID_SIZE - 1, col));
        const clampedRow = Math.max(0, Math.min(maxRows - 1, row));
        const index = clampedRow * GRID_SIZE + clampedCol;
        const location = currentWorkshop === 'pve' ? 'pveGrid' : 'farmGrid';
        const selector = `.grid-slot[data-location="${location}"][data-index="${index}"]`;
        const el = document.querySelector(selector);
        return el ? { element: el, location, index, cols: GRID_SIZE } : null;
    }

    // Bank grid
    const bankRect = bankGrid.getBoundingClientRect();
    if (clientX >= bankRect.left && clientX <= bankRect.right && clientY >= bankRect.top && clientY <= bankRect.bottom) {
        const relX = clientX - bankRect.left;
        const relY = clientY - bankRect.top;
        const col = Math.floor(relX / bankGeo.cellW);
        const row = Math.floor(relY / bankGeo.cellH);
        // Determine bank columns based on current workshop/storage-mode
        const bankCols = (typeof getBankCols === 'function') ? getBankCols() : ((document.querySelector('.workshop-content') && document.querySelector('.workshop-content').classList.contains('storage-mode')) || currentWorkshop === 'storage' ? 10 : 6);
        const maxRows = Math.ceil(BANK_SLOTS / bankCols);
        const clampedCol = Math.max(0, Math.min(bankCols - 1, col));
        const clampedRow = Math.max(0, Math.min(maxRows - 1, row));
        const index = clampedRow * bankCols + clampedCol;
        const selector = `.grid-slot[data-location="bank"][data-index="${index}"]`;
        const el = document.querySelector(selector);
        return el ? { element: el, location: 'bank', index, cols: bankCols } : null;
    }

    return null;
}

// ===== HELPER: Show/Hide all aura overlays =====
function showAllAuras() {
    document.querySelectorAll('.aura-overlay').forEach(aura => {
        aura.style.opacity = '1';
    });
}
window.showAllAuras = showAllAuras;

function hideAllAuras() {
    if (window.altKeyPressed) return; // Don't hide if Alt is pressed
    document.querySelectorAll('.aura-overlay').forEach(aura => {
        aura.style.opacity = '0';
    });
}
window.hideAllAuras = hideAllAuras;

function startCustomDrag(item, fromLocation, fromIndex, offsetX, offsetY, previewShape, sourceElem, startEvent, instanceId, rotatedAura, rotationIndex) {
    if (!item) return;
    // Ensure any existing drag cleaned
    if (draggedItem) return;

    // CRITICAL: Always use item body, NEVER previewShape (which might contain aura)
    const initialRotationIndex = (typeof rotationIndex === 'number') ? rotationIndex : 0;
    const baseShape = (typeof getItemBodyMatrix === 'function')
        ? getItemBodyMatrix(item, initialRotationIndex)
        : item.body;
    if (!baseShape) {
        console.error('❌ Item has no body shape!', item.id);
        return;
    }
    draggedItem = {
        item: item,
        fromLocation: fromLocation,
        fromIndex: fromIndex,
        // store the originating grid column count so restores/drops use same geometry
        fromCols: (fromLocation === 'bank') ? (typeof getBankCols === 'function' ? getBankCols() : ((document.querySelector('.workshop-content') && document.querySelector('.workshop-content').classList.contains('storage-mode')) || currentWorkshop === 'storage' ? 10 : 6)) : GRID_SIZE,
        offsetX: offsetX || 0,
        offsetY: offsetY || 0,
        previewShape: baseShape.map(r => [...r]),
        rotatedAura: (typeof getItemAuraMatrix === 'function')
            ? getItemAuraMatrix(item, initialRotationIndex)
            : (rotatedAura || null),
        rotationIndex: initialRotationIndex,
        instanceId: instanceId // Store instance ID for tracking
    };

    // Show all auras during drag
    showAllAuras();

    // Hide cursor during drag for cleaner feel
    document.body.style.cursor = 'none';

    // remove item from grid for preview
    clearItemFromGrid(gameData[fromLocation], instanceId);
    try { queueRenderWorkshopGrids(); } catch (err) { renderWorkshopGrids(); }

    // create follow element
    _customFollowEl = document.createElement('div');
    _customFollowEl.className = 'item follow-item ' + (item.rarity || 'common');
    _customFollowEl.style.position = 'fixed';
    _customFollowEl.style.pointerEvents = 'none';
    _customFollowEl.style.zIndex = 99999;

    const shape = draggedItem.previewShape || [[1]];
    const rows = shape.length;
    const cols = shape[0] ? shape[0].length : 1;
    const sourceGrid = (sourceElem && sourceElem.closest) ? sourceElem.closest('.inventory-grid') : document.getElementById('bank-grid');
    // Determine columns for source grid (bank vs active)
    let sourceGridCols = GRID_SIZE;
    try {
        if (sourceGrid && sourceGrid.id === 'bank-grid') sourceGridCols = (typeof getBankCols === 'function') ? getBankCols() : 6;
        else sourceGridCols = GRID_SIZE;
    } catch (e) { sourceGridCols = GRID_SIZE; }
    const geo = getCellGeometry(sourceGrid || document.body, sourceGridCols);
    const slotSize = geo.slotSize;
    const gap = geo.gap;
    const cellW2 = geo.cellW;
    const cellH2 = geo.cellH;
    // (debug logging removed)
    _customFollowEl.style.width = (cols * cellW2 - gap) + 'px';
    _customFollowEl.style.height = (rows * cellH2 - gap) + 'px';
    
    // CRITICAL: Use relative positioning to allow absolute children (aura, icon)
    _customFollowEl.style.position = 'fixed'; 
    _customFollowEl.style.display = 'block'; // Not grid! We'll use a wrapper for grid
    _customFollowEl.style.opacity = '0.9';
    _customFollowEl.style.transition = 'none';
    
    // Create grid wrapper for shape blocks
    const gridWrapper = document.createElement('div');
    gridWrapper.style.display = 'grid';
    gridWrapper.style.gridTemplateColumns = `repeat(${cols}, ${slotSize}px)`;
    gridWrapper.style.gridTemplateRows = `repeat(${rows}, ${slotSize}px)`;
    gridWrapper.style.gap = gap + 'px';
    gridWrapper.style.position = 'relative';
    gridWrapper.style.boxSizing = 'border-box';
    gridWrapper.style.alignItems = 'start';
    gridWrapper.style.justifyItems = 'start';

    // fill visual squares similar to item
    shape.forEach((row, r) => {
        row.forEach((cell, c) => {
            const pixel = document.createElement('div');
            pixel.style.boxSizing = 'border-box';
            pixel.style.width = slotSize + 'px';
            pixel.style.height = slotSize + 'px';
            if (cell) {
                pixel.className = 'shape-block ' + (item.rarity || 'common');
            } else {
                pixel.className = 'shape-empty';
            }
            gridWrapper.appendChild(pixel);
        });
    });
    
    _customFollowEl.appendChild(gridWrapper);
    
    // ADD AURA OVERLAY FIRST (behind icon)
    // Use rotated aura if available (when picking up rotated item)
    const aura = (typeof getItemAuraMatrix === 'function')
        ? getItemAuraMatrix(item, draggedItem.rotationIndex)
        : (draggedItem.rotatedAura || item.aura);
    if (aura) {
        const auraOverlay = document.createElement('div');
        auraOverlay.className = 'aura-overlay';
        auraOverlay.style.position = 'absolute';
        auraOverlay.style.top = '0';
        auraOverlay.style.left = '0';
        auraOverlay.style.opacity = '1';
        auraOverlay.style.pointerEvents = 'none';
        auraOverlay.style.zIndex = '1'; // Below icon
        auraOverlay.style.display = 'grid';
        
        const auraRows = aura.length;
        const auraCols = aura[0] ? aura[0].length : 1;
            auraOverlay.style.width = ((auraCols * slotSize) + ((auraCols - 1) * gap)) + 'px';
            auraOverlay.style.height = ((auraRows * slotSize) + ((auraRows - 1) * gap)) + 'px';
            auraOverlay.style.gridTemplateColumns = `repeat(${auraCols}, ${slotSize}px)`;
            auraOverlay.style.gridTemplateRows = `repeat(${auraRows}, ${slotSize}px)`;
            auraOverlay.style.gap = gap + 'px';
        
        // Align aura using body bounds inside the combined grid (use left/top for consistency)
        const bounds = (typeof getItemBodyBounds === 'function')
            ? getItemBodyBounds(item, draggedItem.rotationIndex)
            : { minR: 0, minC: 0 };
        const offsetX = -bounds.minC * cellW2;
        const offsetY = -bounds.minR * cellH2;
        auraOverlay.style.left = offsetX + 'px';
        auraOverlay.style.top = offsetY + 'px';
        
        aura.forEach((row, r) => {
            if (!Array.isArray(row)) return;
            row.forEach((cellValue, c) => {
                const auraCell = document.createElement('div');
                auraCell.style.width = slotSize + 'px';
                auraCell.style.height = slotSize + 'px';
                auraCell.style.boxSizing = 'border-box';
                if (cellValue === 1) {
                    auraCell.style.backgroundColor = 'rgba(100, 200, 255, 0.4)';
                    auraCell.style.border = '2px solid rgba(100, 200, 255, 0.7)';
                } else {
                    auraCell.style.backgroundColor = 'transparent';
                    auraCell.style.border = 'none';
                }
                auraCell.style.borderRadius = '4px';
                auraOverlay.appendChild(auraCell);
            });
        });
        
        _customFollowEl.appendChild(auraOverlay);
    }
    
    // ADD ICON / SPRITE LAST (on top)
    if (item.sprite || item.image) {
        const img = document.createElement('img');
        img.src = item.sprite || item.image;
        img.alt = item.name || '';
        img.className = 'item-sprite';
        img.style.position = 'absolute';
        img.style.top = '50%';
        img.style.left = '50%';
        img.style.transform = 'translate(-50%, -50%)';
        img.style.zIndex = '100';
        img.style.pointerEvents = 'none';
        img.style.maxWidth = '90%';
        img.style.maxHeight = '90%';
        _customFollowEl.appendChild(img);
    } else {
        const icon = document.createElement('div');
        icon.className = 'item-icon-overlay';
        icon.style.position = 'absolute';
        icon.style.top = '50%';
        icon.style.left = '50%';
        icon.style.transform = 'translate(-50%, -50%)';
        icon.style.zIndex = '100'; // Above everything
        icon.style.pointerEvents = 'none';
        icon.style.fontSize = '2rem';
        icon.innerText = item.icon;
        _customFollowEl.appendChild(icon);
    }

    document.body.appendChild(_customFollowEl);

    

    // Function to rebuild follow element visuals when shape changes (e.g., rotation)
    window._updateFollowElement = function() {
        console.log('🎨 _updateFollowElement called: draggedItem=' + (draggedItem ? draggedItem.item.id : 'null') + ' rotIndex=' + (draggedItem ? draggedItem.rotationIndex : '?'));
        if (!draggedItem || !_customFollowEl) return;
        const shape = draggedItem.previewShape || [[1]];
        const rows = shape.length;
        const cols = shape[0] ? shape[0].length : 1;
        
        // Update dimensions based on runtime cell geometry
        // Choose the grid element according to where the item was picked up (fromLocation)
        let gridEl = document.body;
        try {
            if (draggedItem && draggedItem.fromLocation === 'bank') {
                gridEl = document.getElementById('bank-grid') || document.querySelector('.workshop-content .bank-section .inventory-grid') || document.querySelector('.inventory-grid') || document.body;
            } else {
                // active grid (farm/pve)
                gridEl = document.getElementById('active-setup-grid') || document.querySelector('.workshop-content .active-section .inventory-grid') || document.querySelector('.inventory-grid') || document.body;
            }
        } catch (e) {
            gridEl = document.querySelector('.inventory-grid') || document.body;
        }
        const debugGridInfo = { gridEl: gridEl && (gridEl.id || gridEl.className), fromLocation: draggedItem && draggedItem.fromLocation };
        // compute grid columns for gridEl when possible
        let gridColsLocal = GRID_SIZE;
        try {
            if (gridEl && gridEl.id === 'bank-grid') gridColsLocal = (typeof getBankCols === 'function') ? getBankCols() : 6;
            else gridColsLocal = GRID_SIZE;
        } catch (e) { gridColsLocal = GRID_SIZE; }
        const geo2 = getCellGeometry(gridEl, gridColsLocal);
        // (debug logging removed)
        const slotSize2 = geo2.slotSize;
        const gap2 = geo2.gap;
        const cellWLocal = geo2.cellW;
        const cellHLocal = geo2.cellH;
        _customFollowEl.style.width = (cols * cellWLocal - gap2) + 'px';
        _customFollowEl.style.height = (rows * cellHLocal - gap2) + 'px';
        
        // Clear all children
        while (_customFollowEl.firstChild) _customFollowEl.removeChild(_customFollowEl.firstChild);
        
        // Create grid wrapper
        const gridWrapper = document.createElement('div');
        gridWrapper.style.display = 'grid';
        gridWrapper.style.gridTemplateColumns = `repeat(${cols}, ${slotSize2}px)`;
        gridWrapper.style.gridTemplateRows = `repeat(${rows}, ${slotSize2}px)`;
        gridWrapper.style.gap = gap2 + 'px';
        gridWrapper.style.position = 'relative';
        
        // Redraw shape blocks
        shape.forEach((row, r) => {
            row.forEach((cell, c) => {
                const pixel = document.createElement('div');
                if (cell) {
                    pixel.className = 'shape-block ' + (draggedItem.item.rarity || 'common');
                } else {
                    pixel.className = 'shape-empty';
                }
                gridWrapper.appendChild(pixel);
            });
        });
        
        _customFollowEl.appendChild(gridWrapper);
        
        // ADD AURA OVERLAY (using rotated aura if available)
        const aura = (typeof getItemAuraMatrix === 'function')
            ? getItemAuraMatrix(draggedItem.item, draggedItem.rotationIndex)
            : (draggedItem.rotatedAura || draggedItem.item.aura);
        if (aura) {
            const auraOverlay = document.createElement('div');
            auraOverlay.className = 'aura-overlay';
            auraOverlay.style.position = 'absolute';
            auraOverlay.style.top = '0';
            auraOverlay.style.left = '0';
            auraOverlay.style.opacity = '1';
            auraOverlay.style.pointerEvents = 'none';
            auraOverlay.style.zIndex = '1';
            auraOverlay.style.display = 'grid';
            
            const auraRows = aura.length;
            const auraCols = aura[0] ? aura[0].length : 1;
            auraOverlay.style.width = ((auraCols * slotSize2) + ((auraCols - 1) * gap2)) + 'px';
            auraOverlay.style.height = ((auraRows * slotSize2) + ((auraRows - 1) * gap2)) + 'px';
            auraOverlay.style.gridTemplateColumns = `repeat(${auraCols}, ${slotSize2}px)`;
            auraOverlay.style.gridTemplateRows = `repeat(${auraRows}, ${slotSize2}px)`;
            auraOverlay.style.gap = gap2 + 'px';

            // Align aura using body bounds inside the combined grid
            const bounds = (typeof getItemBodyBounds === 'function')
                ? getItemBodyBounds(draggedItem.item, draggedItem.rotationIndex)
                : { minR: 0, minC: 0 };
            const offsetX = -bounds.minC * cellWLocal;
            const offsetY = -bounds.minR * cellHLocal;
            auraOverlay.style.left = offsetX + 'px';
            auraOverlay.style.top = offsetY + 'px';
            
            aura.forEach((row, r) => {
                if (!Array.isArray(row)) return;
                row.forEach((cellValue, c) => {
                    const auraCell = document.createElement('div');
                    auraCell.style.width = slotSize2 + 'px';
                    auraCell.style.height = slotSize2 + 'px';
                    if (cellValue === 1) {
                        auraCell.style.backgroundColor = 'rgba(100, 200, 255, 0.4)';
                        auraCell.style.border = '2px solid rgba(100, 200, 255, 0.7)';
                    } else {
                        auraCell.style.backgroundColor = 'transparent';
                        auraCell.style.border = 'none';
                    }
                    auraCell.style.borderRadius = '4px';
                    auraOverlay.appendChild(auraCell);
                });
            });
            
            _customFollowEl.appendChild(auraOverlay);
        }
        
        // ADD ICON / SPRITE (on top)
        if (draggedItem.item.sprite || draggedItem.item.image) {
            const img = document.createElement('img');
            img.src = draggedItem.item.sprite || draggedItem.item.image;
            img.alt = draggedItem.item.name || '';
            img.className = 'item-sprite';
            img.style.position = 'absolute';
            img.style.top = '50%';
            img.style.left = '50%';
            img.style.transform = 'translate(-50%, -50%)';
            img.style.zIndex = '100';
            img.style.pointerEvents = 'none';
            img.style.maxWidth = '90%';
            img.style.maxHeight = '90%';
            _customFollowEl.appendChild(img);
        } else {
            const icon = document.createElement('div');
            icon.className = 'item-icon-overlay';
            icon.style.position = 'absolute';
            icon.style.top = '50%';
            icon.style.left = '50%';
            icon.style.transform = 'translate(-50%, -50%)';
            icon.style.zIndex = '100';
            icon.style.pointerEvents = 'none';
            icon.style.fontSize = '2rem';
            icon.innerText = draggedItem.item.icon;
            _customFollowEl.appendChild(icon);
        }
    };

    // capture initial offsets locally to avoid race when draggedItem becomes null during cleanup
    const _localOffsetX = draggedItem.offsetX;
    const _localOffsetY = draggedItem.offsetY;

    // Throttled positioning: use requestAnimationFrame to avoid doing heavy layout math on every pointermove
    let _pendingRAF = false;
    let _rafX = 0;
    let _rafY = 0;

    const doUpdatePos = (clientX, clientY) => {
        window._dragLastPos = { x: clientX, y: clientY };
        const curOffsetX = (draggedItem && typeof draggedItem.offsetX === 'number') ? draggedItem.offsetX : _localOffsetX;
        const curOffsetY = (draggedItem && typeof draggedItem.offsetY === 'number') ? draggedItem.offsetY : _localOffsetY;
        // Determine grid under cursor to get accurate cell geometry
        let geoUnder = null;
        let gridEl = null;
        let colsUnder = GRID_SIZE;
        try {
            const elems = document.elementsFromPoint(clientX, clientY);
            const slot = elems && elems.find(el => el.classList && el.classList.contains('grid-slot')) || null;
            gridEl = slot ? slot.closest('.inventory-grid') : null;
            // when hit-testing use the cols of the detected grid if available
            try { colsUnder = (gridEl && gridEl.id === 'bank-grid') ? (typeof getBankCols === 'function' ? getBankCols() : 6) : GRID_SIZE; } catch (e) { colsUnder = GRID_SIZE; }
            geoUnder = getCellGeometry(gridEl || document.getElementById('bank-grid') || document.body, colsUnder);
        } catch (err) {
            colsUnder = (typeof getBankCols === 'function') ? getBankCols() : 6;
            geoUnder = getCellGeometry(document.getElementById('bank-grid') || document.body, colsUnder);
        }
        // Snap follow element to nearest cell to avoid subpixel tearing across displays
        try {
            const containerEl = gridEl || document.getElementById('bank-grid') || document.body;
            const rect = containerEl.getBoundingClientRect();
            const relX = clientX - rect.left;
            const relY = clientY - rect.top;
            const col = Math.max(0, Math.min((colsUnder || 1) - 1, Math.round(relX / geoUnder.cellW)));
            const row = Math.max(0, Math.min(Math.ceil((containerEl === document.body ? window.innerHeight : containerEl.clientHeight) / geoUnder.cellH) - 1, Math.round(relY / geoUnder.cellH)));
            const px = Math.round(rect.left + (col * geoUnder.cellW) - (curOffsetX * geoUnder.cellW));
            const py = Math.round(rect.top + (row * geoUnder.cellH) - (curOffsetY * geoUnder.cellH));
            if (_customFollowEl) {
                _customFollowEl.style.left = px + 'px';
                _customFollowEl.style.top = py + 'px';
                _customFollowEl.style.willChange = 'left, top, transform';
            }
        } catch (e) {
            // fallback to best-effort positioning
            const px = Math.round(clientX - (curOffsetX * geoUnder.cellW));
            const py = Math.round(clientY - (curOffsetY * geoUnder.cellH));
            if (_customFollowEl) {
                _customFollowEl.style.left = px + 'px';
                _customFollowEl.style.top = py + 'px';
            }
        }
    };

    // Expose direct updater for immediate repositioning (used after rotation)
    window._updateFollowElementPosition = (x, y) => { doUpdatePos(x, y); };

    // Throttled wrapper invoked on pointermove
    const updatePos = (clientX, clientY) => {
        _rafX = clientX;
        _rafY = clientY;
        if (_pendingRAF) return;
        _pendingRAF = true;
        requestAnimationFrame(() => {
            _pendingRAF = false;
            doUpdatePos(_rafX, _rafY);
        });
    };

    // initial position
    const initX = (startEvent && startEvent.clientX) || (window._dragLastPos && window._dragLastPos.x) || (window.innerWidth/2);
    const initY = (startEvent && startEvent.clientY) || (window._dragLastPos && window._dragLastPos.y) || (window.innerHeight/2);
    updatePos(initX, initY);

    // pointer move/up handlers
    _customPointerMove = (ev) => {
        if (!draggedItem) return;
        ev.preventDefault();
        updatePos(ev.clientX, ev.clientY);
        // update hover target via elementsFromPoint
        try {
            const elems = document.elementsFromPoint(ev.clientX, ev.clientY);
            // Targeted snapshot for problematic armor item to diagnose left-storage tearing
            try {
                if (window.DEBUG_DRAG && draggedItem && draggedItem.item && draggedItem.item.id === 'armor_new_2') {
                    const snap = elems.slice(0,8).map(el => ({ tag: el.tagName, id: el.id || null, class: el.className || null, dataset: el.dataset && { location: el.dataset.location, index: el.dataset.index } }));
                    // (debug logging removed)
                }
            } catch (e) { /* ignore */ }
            const slot = elems && elems.find(el => el.classList && el.classList.contains('grid-slot')) || null;
            if (slot) {
                const loc = slot.dataset.location;
                const idx = parseInt(slot.dataset.index);
                if (!draggedItem.hoverTarget || draggedItem.hoverTarget.location !== loc || draggedItem.hoverTarget.index !== idx) {
                    draggedItem.hoverTarget = { location: loc, index: idx };
                    draggedItem._lastValidSlot = slot; // store the actual slot for fallback at drop
                    try { queueRenderWorkshopGrids(); } catch (err) { renderWorkshopGrids(); }
                }
            } else if (draggedItem.hoverTarget) {
                delete draggedItem.hoverTarget;
                try { queueRenderWorkshopGrids(); } catch (err) { renderWorkshopGrids(); }
            }
        } catch (err) {
            // ignore
        }
    };

    _customPointerUp = (ev) => {
        ev.preventDefault();
        try {
            // debug: log current offsets and shape at drop
            console.log('drop - draggedItem offsets/shape', draggedItem && { offsetX: draggedItem.offsetX, offsetY: draggedItem.offsetY, shape: (draggedItem.previewShape || []).map(r=>r.length) });
            
            // Check if dropped on SELL ZONE first
            const elemsForSell = document.elementsFromPoint(ev.clientX, ev.clientY);
            const sellZone = elemsForSell && elemsForSell.find(el => el.id === 'sell-zone');
            
            if (sellZone && draggedItem) {
                console.log('💰 SELL ATTEMPT (custom drag)', { itemId: draggedItem.item.id, instanceId: draggedItem.instanceId, fromLocation: draggedItem.fromLocation, item: draggedItem.item });
                const item = draggedItem.item;
                const sellPrice = Math.floor(item.price * 0.5);
                console.log('  Price:', item.price, '→ Sell for:', sellPrice);
                gameData.gold += sellPrice;
                console.log('  Gold now:', gameData.gold);
                // Item already cleared from grid when drag started, so just null draggedItem
                hideAllAuras(); // Hide aura when drag ends
                draggedItem = null;
                updateUI();
                saveGame();
                console.log('  ✅ SELL COMPLETE');
                
                // Cleanup and exit
                setTimeout(() => {
                    if (_customFollowEl && _customFollowEl.parentNode) _customFollowEl.parentNode.removeChild(_customFollowEl);
                    _customFollowEl = null;
                    window.removeEventListener('pointermove', _customPointerMove);
                    window.removeEventListener('pointerup', _customPointerUp);
                    _customPointerMove = null;
                    _customPointerUp = null;
                    document.body.style.cursor = '';
                    document.body.classList.remove('dragging','drop-allowed','drop-invalid');
                    try { queueRenderWorkshopGrids(); } catch (err) { renderWorkshopGrids(); }
                }, 10);
                return;
            }
            
            // Try to find slot BEFORE hiding the follow element
            const elemsBefore = document.elementsFromPoint(ev.clientX, ev.clientY);
            const slotBefore = elemsBefore && elemsBefore.find(el => el.classList && el.classList.contains('grid-slot')) || null;
            if (slotBefore && draggedItem) {
                draggedItem._dropSlot = slotBefore; // Store the drop slot for fallback
            }
            
            // hide follow element briefly so elementsFromPoint hits underlying slots
            if (_customFollowEl) _customFollowEl.style.display = 'none';
            const elems = document.elementsFromPoint(ev.clientX, ev.clientY);
            const slot = elems && elems.find(el => el.classList && el.classList.contains('grid-slot')) || null;
            console.log('custom drop coords', ev.clientX, ev.clientY, 'found slot', !!slot, 'hoverTarget', draggedItem && draggedItem.hoverTarget);
            
            let dropSlot = slot || draggedItem._dropSlot || draggedItem._lastValidSlot || null;
            if (!dropSlot) {
                const fallback = _getGridSlotFromPoint(ev.clientX, ev.clientY);
                if (fallback && fallback.element) dropSlot = fallback.element;
            }
            if (!dropSlot && window._dragLastPos) {
                const fallback = _getGridSlotFromPoint(window._dragLastPos.x, window._dragLastPos.y);
                if (fallback && fallback.element) dropSlot = fallback.element;
            }
            
            if (dropSlot) {
                handleDropInSlot({ preventDefault: () => {}, currentTarget: dropSlot });
            } else if (draggedItem && draggedItem.hoverTarget) {
                // final fallback: try hoverTarget selector
                const selector = `.grid-slot[data-location="${draggedItem.hoverTarget.location}"][data-index="${draggedItem.hoverTarget.index}"]`;
                const slot2 = document.querySelector(selector);
                console.log('custom drop fallback selector', selector, 'found', !!slot2);
                if (slot2) handleDropInSlot({ preventDefault: () => {}, currentTarget: slot2 });
            }
        } catch (err) {
            console.warn('custom drop failed', err);
        }

        // Hide aura overlays when drag ends
        hideAllAuras();

        // cleanup follow element after a short timeout to allow placement to clear draggedItem
        setTimeout(() => {
            if (_customFollowEl && _customFollowEl.parentNode) _customFollowEl.parentNode.removeChild(_customFollowEl);
            _customFollowEl = null;
            window.removeEventListener('pointermove', _customPointerMove);
            window.removeEventListener('pointerup', _customPointerUp);
            _customPointerMove = null;
            _customPointerUp = null;
            // Restore cursor
            document.body.style.cursor = '';
            // if draggedItem still exists (drop failed), restore
            if (draggedItem) {
                if (gameData[draggedItem.fromLocation]) {
                    const fromCols = draggedItem.fromCols || (draggedItem.fromLocation === 'bank' ? ((document.querySelector('.workshop-content') && document.querySelector('.workshop-content').classList.contains('storage-mode')) || currentWorkshop === 'storage' ? 10 : 6) : GRID_SIZE);
                    const restoreShape = (typeof getItemBodyMatrix === 'function')
                        ? getItemBodyMatrix(draggedItem.item, draggedItem.rotationIndex || 0)
                        : (draggedItem.item?.body || draggedItem.previewShape);
                    placeItemIntoGrid(
                        gameData[draggedItem.fromLocation],
                        draggedItem.fromIndex,
                        draggedItem.item,
                        restoreShape,
                        fromCols,
                        draggedItem.instanceId,
                        null,
                        draggedItem.rotatedAura || null,
                        draggedItem.rotationIndex
                    );
                }
                draggedItem = null;
                try { queueRenderWorkshopGrids(); } catch (err) { renderWorkshopGrids(); }
            }
            document.body.classList.remove('dragging','drop-allowed','drop-invalid');
            _lastDropState = null;
        }, 10);
    };

    window.addEventListener('pointermove', _customPointerMove);
    window.addEventListener('pointerup', _customPointerUp, { once: true });
}

// Expose startCustomDrag globally so workshopEngine can call it
window.startCustomDrag = startCustomDrag;

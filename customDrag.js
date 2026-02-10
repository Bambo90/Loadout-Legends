// customDrag.js
// Pointer-based drag & drop replacement to avoid native drag inconsistencies.

let _customFollowEl = null;
let _customPointerMove = null;
let _customPointerUp = null;

function _getGridSlotFromPoint(clientX, clientY) {
    const bankGrid = document.getElementById('bank-grid');
    const activeGrid = document.getElementById('active-setup-grid');
    if (!bankGrid || !activeGrid) return null;

    const cellW = 64 + 8;
    const cellH = 64 + 8;

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
        const col = Math.floor(relX / cellW);
        const row = Math.floor(relY / cellH);
        const maxRows = Math.ceil(BANK_SLOTS / 6);
        const clampedCol = Math.max(0, Math.min(6 - 1, col));
        const clampedRow = Math.max(0, Math.min(maxRows - 1, row));
        const index = clampedRow * 6 + clampedCol;
        const selector = `.grid-slot[data-location="bank"][data-index="${index}"]`;
        const el = document.querySelector(selector);
        return el ? { element: el, location: 'bank', index, cols: 6 } : null;
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

function startCustomDrag(item, fromLocation, fromIndex, offsetX, offsetY, previewShape, sourceElem, startEvent, instanceId, rotatedAura) {
    if (!item) return;
    // Ensure any existing drag cleaned
    if (draggedItem) return;

    // CRITICAL: Always use item.body, NEVER previewShape (which might contain aura)
    const baseShape = item.body;
    if (!baseShape) {
        console.error('❌ Item has no body shape!', item.id);
        return;
    }
    draggedItem = {
        item: item,
        fromLocation: fromLocation,
        fromIndex: fromIndex,
        offsetX: offsetX || 0,
        offsetY: offsetY || 0,
        previewShape: baseShape.map(r => [...r]),
        rotatedAura: rotatedAura || null, // Preserve rotation from grid if exists
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
    _customFollowEl.style.width = ((cols * 64) + ((cols - 1) * 8)) + 'px';
    _customFollowEl.style.height = ((rows * 64) + ((rows - 1) * 8)) + 'px';
    
    // CRITICAL: Use relative positioning to allow absolute children (aura, icon)
    _customFollowEl.style.position = 'fixed'; 
    _customFollowEl.style.display = 'block'; // Not grid! We'll use a wrapper for grid
    _customFollowEl.style.opacity = '0.9';
    _customFollowEl.style.transition = 'none';
    
    // Create grid wrapper for shape blocks
    const gridWrapper = document.createElement('div');
    gridWrapper.style.display = 'grid';
    gridWrapper.style.gridTemplateColumns = `repeat(${cols}, 64px)`;
    gridWrapper.style.gridTemplateRows = `repeat(${rows}, 64px)`;
    gridWrapper.style.gap = '8px';
    gridWrapper.style.position = 'relative';

    // fill visual squares similar to item
    shape.forEach((row, r) => {
        row.forEach((cell, c) => {
            const pixel = document.createElement('div');
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
    const aura = draggedItem.rotatedAura || item.aura;
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
        auraOverlay.style.width = ((auraCols * 64) + ((auraCols - 1) * 8)) + 'px';
        auraOverlay.style.height = ((auraRows * 64) + ((auraRows - 1) * 8)) + 'px';
        auraOverlay.style.gridTemplateColumns = `repeat(${auraCols}, 64px)`;
        auraOverlay.style.gridTemplateRows = `repeat(${auraRows}, 64px)`;
        auraOverlay.style.gap = '8px';
        
        // Center aura around body
        const offsetX = (cols - auraCols) / 2 * (64 + 8);
        const offsetY = (rows - auraRows) / 2 * (64 + 8);
        auraOverlay.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        
        aura.forEach((row, r) => {
            if (!Array.isArray(row)) return;
            row.forEach((cellValue, c) => {
                const auraCell = document.createElement('div');
                auraCell.style.width = '64px';
                auraCell.style.height = '64px';
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
    
    // ADD ICON LAST (on top)
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

    document.body.appendChild(_customFollowEl);

    // Function to rebuild follow element visuals when shape changes (e.g., rotation)
    window._updateFollowElement = function() {
        if (!draggedItem || !_customFollowEl) return;
        const shape = draggedItem.previewShape || [[1]];
        const rows = shape.length;
        const cols = shape[0] ? shape[0].length : 1;
        
        // Update dimensions
        _customFollowEl.style.width = ((cols * 64) + ((cols - 1) * 8)) + 'px';
        _customFollowEl.style.height = ((rows * 64) + ((rows - 1) * 8)) + 'px';
        
        // Clear all children
        while (_customFollowEl.firstChild) _customFollowEl.removeChild(_customFollowEl.firstChild);
        
        // Create grid wrapper
        const gridWrapper = document.createElement('div');
        gridWrapper.style.display = 'grid';
        gridWrapper.style.gridTemplateColumns = `repeat(${cols}, 64px)`;
        gridWrapper.style.gridTemplateRows = `repeat(${rows}, 64px)`;
        gridWrapper.style.gap = '8px';
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
        const aura = draggedItem.rotatedAura || draggedItem.item.aura;
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
            auraOverlay.style.width = ((auraCols * 64) + ((auraCols - 1) * 8)) + 'px';
            auraOverlay.style.height = ((auraRows * 64) + ((auraRows - 1) * 8)) + 'px';
            auraOverlay.style.gridTemplateColumns = `repeat(${auraCols}, 64px)`;
            auraOverlay.style.gridTemplateRows = `repeat(${auraRows}, 64px)`;
            auraOverlay.style.gap = '8px';
            
            // Center aura around body
            const offsetX = (cols - auraCols) / 2 * (64 + 8);
            const offsetY = (rows - auraRows) / 2 * (64 + 8);
            auraOverlay.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
            
            aura.forEach((row, r) => {
                if (!Array.isArray(row)) return;
                row.forEach((cellValue, c) => {
                    const auraCell = document.createElement('div');
                    auraCell.style.width = '64px';
                    auraCell.style.height = '64px';
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
        
        // ADD ICON (on top)
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
    };

    // capture initial offsets locally to avoid race when draggedItem becomes null during cleanup
    const _localOffsetX = draggedItem.offsetX;
    const _localOffsetY = draggedItem.offsetY;
    // position (use current draggedItem offsets if available so rotations update follow position)
    const updatePos = (clientX, clientY) => {
        window._dragLastPos = { x: clientX, y: clientY };
        const curOffsetX = (draggedItem && typeof draggedItem.offsetX === 'number') ? draggedItem.offsetX : _localOffsetX;
        const curOffsetY = (draggedItem && typeof draggedItem.offsetY === 'number') ? draggedItem.offsetY : _localOffsetY;
        const px = clientX - (curOffsetX * (64 + 8));
        const py = clientY - (curOffsetY * (64 + 8));
        if (_customFollowEl) {
            _customFollowEl.style.left = px + 'px';
            _customFollowEl.style.top = py + 'px';
        }
    };
    
    // Expose updatePos globally so rotation can update position after offset changes
    window._updateFollowElementPosition = updatePos;

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
                    const fromCols = draggedItem.fromLocation === 'bank' ? 6 : GRID_SIZE;
                    const restoreShape = draggedItem.item?.body || draggedItem.previewShape;
                    placeItemIntoGrid(gameData[draggedItem.fromLocation], draggedItem.fromIndex, draggedItem.item, restoreShape, fromCols, draggedItem.instanceId, null, draggedItem.rotatedAura || null);
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

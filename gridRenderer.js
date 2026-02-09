// =====================================
// GRID RENDERER (Gridrenderer.js)
// Rendert Slots + Items sauber aus Grid
// ================================

function createSlot(container, location, index, cols) {
    const slot = document.createElement('div');
    slot.classList.add('grid-slot');
    slot.dataset.location = location;
    slot.dataset.index = index;
    slot.dataset.cols = cols;

    slot.addEventListener('dragover', e => e.preventDefault());
    slot.addEventListener('drop', handleDropInSlot);

    const grid = gameData[location];
    const cell = grid[index];

    // Falls Slot leer oder kein Anker (Root), nur leeren Slot rendern
    if (!cell || !cell.root) {
        container.appendChild(slot);
        return;
    }

    const item = getItemById(cell.itemId);
    if (!item) {
        container.appendChild(slot);
        return;
    }

    const shape = item.body; // Wir nutzen 'body' laut aktuellem Stand
    const rows = shape.length;
    const colsShape = shape[0].length;

    const itemEl = document.createElement('div');
    itemEl.classList.add('item', item.rarity);
    itemEl.draggable = true;

    // Dimensionen berechnen (64px Slot + 8px Gap)
    itemEl.style.width = ((colsShape * 64) + ((colsShape - 1) * 8)) + "px";
    itemEl.style.height = ((rows * 64) + ((rows - 1) * 8)) + "px";
    itemEl.style.display = "grid";
    itemEl.style.gridTemplateColumns = `repeat(${colsShape}, 64px)`;
    itemEl.style.gridTemplateRows = `repeat(${rows}, 64px)`;
    itemEl.style.gap = "8px";
    itemEl.style.zIndex = "100";

    shape.forEach((row, r) => {
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

    const icon = document.createElement('div');
    icon.classList.add('item-icon-overlay');
    icon.innerText = item.icon;
    icon.style.pointerEvents = "none"; // Damit das Icon den Drag nicht blockiert
    itemEl.appendChild(icon);

    itemEl.addEventListener('dragstart', (e) => {
        // Welchen Teil des Items haben wir gegriffen?
        const p = e.target.closest('.shape-block, .shape-empty');
        
        draggedItem = {
            item: item,
            fromLocation: location,
            fromIndex: index,
            offsetX: p ? parseInt(p.dataset.offsetX) : 0,
            offsetY: p ? parseInt(p.dataset.offsetY) : 0,
            previewShape: item.body.map(r => [...r]) // Kopie der Matrix für Rotation
        };

        // Item während des Drags aus dem Grid "löschen", damit es nicht mit sich selbst kollidiert
        clearItemFromGrid(gameData[location], item.id);
        
        // Timeout damit das Element nicht sofort verschwindet bevor der Browser den Drag-Ghost erstellt
        setTimeout(() => renderWorkshopGrids(), 10);
    });

    slot.appendChild(itemEl);
    container.appendChild(slot);
}

// Hilfsfunktion, falls noch nicht in Itemsengine.js vorhanden:
function getItemById(id) {
    return ALL_ITEMS.find(i => i.id === id);
}
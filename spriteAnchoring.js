// ==========================================
// SPRITE ANCHORING HELPERS (shared)
// Full-grid anchored sprite layout for placed + drag renderers.
// ==========================================

(function initSpriteAnchoring(globalScope) {
    if (!globalScope) return;
    const _loggedLayoutByItemRot = {};

    function normalizeRotationIndex(value) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return 0;
        const rounded = Math.trunc(numeric);
        return ((rounded % 4) + 4) % 4;
    }

    function readSpriteOffset(value) {
        const numeric = Number(value);
        return Number.isFinite(numeric) ? numeric : 0;
    }

    function isValidSpriteBox(box) {
        if (!box || typeof box !== 'object') return false;
        const wCells = Number(box.wCells);
        const hCells = Number(box.hCells);
        return Number.isFinite(wCells) && Number.isFinite(hCells) && wCells > 0 && hCells > 0;
    }

    function resolveSpriteBoxForRotation(spriteBox, spriteBoxByRot, rotationIndex) {
        const rot = normalizeRotationIndex(rotationIndex);
        if (Array.isArray(spriteBoxByRot) && isValidSpriteBox(spriteBoxByRot[rot])) {
            return spriteBoxByRot[rot];
        }
        if (isValidSpriteBox(spriteBox)) return spriteBox;
        if (Array.isArray(spriteBoxByRot)) {
            const fallback = spriteBoxByRot.find(isValidSpriteBox);
            if (fallback) return fallback;
        }
        return null;
    }

    function hasAnchoredSpriteMeta(item) {
        if (!item || typeof item !== 'object') return false;
        return !!item.spriteAnchorCell;
    }

    function _getRotationGrid(item, rotationIndex) {
        if (!item || typeof item !== 'object') return null;
        const rot = normalizeRotationIndex(rotationIndex);
        if (rot === 0 && Array.isArray(item.grid)) return item.grid;
        const rotDef = item.rotations && item.rotations[rot];
        if (Array.isArray(rotDef)) return rotDef;
        if (rotDef && Array.isArray(rotDef.grid)) return rotDef.grid;
        return null;
    }

    function _getRotationGridDimensions(item, rotationIndex) {
        const rot = normalizeRotationIndex(rotationIndex);
        const rotGrid = _getRotationGrid(item, rot);
        if (
            Array.isArray(rotGrid) &&
            rotGrid.length > 0 &&
            Array.isArray(rotGrid[0]) &&
            rotGrid[0].length > 0
        ) {
            return { wCells: rotGrid[0].length, hCells: rotGrid.length };
        }
        return null;
    }

    function rotateCellFromRot0(anchor0, rot, rot0W, rot0H) {
        const x0 = Number(anchor0 && anchor0.x);
        const y0 = Number(anchor0 && anchor0.y);
        const w0 = Number(rot0W);
        const h0 = Number(rot0H);
        if (!Number.isFinite(x0) || !Number.isFinite(y0)) return null;
        if (!Number.isFinite(w0) || !Number.isFinite(h0) || w0 <= 0 || h0 <= 0) return { x: x0, y: y0 };

        const rotation = normalizeRotationIndex(rot);
        if (rotation === 0) return { x: x0, y: y0 };
        if (rotation === 1) return { x: (h0 - 1) - y0, y: x0 };
        if (rotation === 2) return { x: (w0 - 1) - x0, y: (h0 - 1) - y0 };
        return { x: y0, y: (w0 - 1) - x0 };
    }

    function rotateOffsetByRot(dx, dy, rot) {
        const rotation = normalizeRotationIndex(rot);
        if (rotation === 0) return { x: dx, y: dy };
        if (rotation === 1) return { x: -dy, y: dx };
        if (rotation === 2) return { x: -dx, y: -dy };
        return { x: dy, y: -dx };
    }

    function _computeItemSquareBoxCellsFromBody(item) {
        let boxCellsItem = 0;
        for (let rot = 0; rot < 4; rot++) {
            const rotGrid = _getRotationGrid(item, rot);
            const bounds = computeBodyBoundsInFullGrid(rotGrid);
            if (!bounds.hasBody) continue;
            const bodyW = Number(bounds.maxC) - Number(bounds.minC) + 1;
            const bodyH = Number(bounds.maxR) - Number(bounds.minR) + 1;
            if (!Number.isFinite(bodyW) || !Number.isFinite(bodyH) || bodyW <= 0 || bodyH <= 0) continue;
            const boxCellsRot = Math.max(bodyW, bodyH);
            if (boxCellsRot > boxCellsItem) boxCellsItem = boxCellsRot;
        }
        if (boxCellsItem > 0) return boxCellsItem;

        // Fallback for items without parseable rotation-grid body flags.
        let fallbackMax = 1;
        for (let rot = 0; rot < 4; rot++) {
            const extents = _getRotationGridDimensions(item, rot);
            const w = Number(extents && extents.wCells);
            const h = Number(extents && extents.hCells);
            if (Number.isFinite(w) && w > fallbackMax) fallbackMax = w;
            if (Number.isFinite(h) && h > fallbackMax) fallbackMax = h;
        }
        return fallbackMax;
    }

    function _resolveSpriteGeometry(config) {
        if (!config || typeof config !== 'object') return null;
        const cellSizeCandidate = (config.cellSizePx !== undefined) ? config.cellSizePx : config.slotSizePx;
        const cellSizePx = Number(cellSizeCandidate);
        if (!Number.isFinite(cellSizePx) || cellSizePx <= 0) return null;

        const stepCandidate = Number(config.stepPx);
        const gapCandidate = Number(config.gapPx);
        const hasStep = Number.isFinite(stepCandidate) && stepCandidate > 0;
        const hasGap = Number.isFinite(gapCandidate) && gapCandidate >= 0;

        const stepPx = hasStep ? stepCandidate : (cellSizePx + (hasGap ? gapCandidate : 0));
        const gapPx = hasGap ? gapCandidate : Math.max(0, stepPx - cellSizePx);

        return { cellSizePx, gapPx, stepPx };
    }

    function computeBodyBoundsInFullGrid(rotGrid) {
        if (!Array.isArray(rotGrid) || rotGrid.length === 0) {
            return { minR: 0, minC: 0, maxR: 0, maxC: 0, hasBody: false };
        }
        let minR = Infinity;
        let minC = Infinity;
        let maxR = -1;
        let maxC = -1;
        for (let r = 0; r < rotGrid.length; r++) {
            const row = rotGrid[r];
            if (!Array.isArray(row)) continue;
            for (let c = 0; c < row.length; c++) {
                const cell = row[c];
                if (typeof cell !== 'string') continue;
                if (!(cell === 'B' || cell === 'AB' || cell.includes('B'))) continue;
                if (r < minR) minR = r;
                if (c < minC) minC = c;
                if (r > maxR) maxR = r;
                if (c > maxC) maxC = c;
            }
        }
        if (maxR < 0 || maxC < 0) {
            return { minR: 0, minC: 0, maxR: 0, maxC: 0, hasBody: false };
        }
        return { minR, minC, maxR, maxC, hasBody: true };
    }

    function getFullRotationGridExtents(item, rotationIndex) {
        const rot = normalizeRotationIndex(rotationIndex);
        const gridDims = _getRotationGridDimensions(item, rot);
        if (gridDims && Number.isFinite(gridDims.wCells) && Number.isFinite(gridDims.hCells) && gridDims.wCells > 0 && gridDims.hCells > 0) {
            return gridDims;
        }

        const spriteBox = resolveSpriteBoxForRotation(
            item && item.spriteBox,
            item && item.spriteBoxByRot,
            rot
        );
        if (isValidSpriteBox(spriteBox)) {
            return {
                wCells: Number(spriteBox.wCells),
                hCells: Number(spriteBox.hCells)
            };
        }

        if (typeof getItemBodyBounds === 'function') {
            const bounds = getItemBodyBounds(item, rot);
            const wCells = Number(bounds.maxC) - Number(bounds.minC) + 1;
            const hCells = Number(bounds.maxR) - Number(bounds.minR) + 1;
            if (Number.isFinite(wCells) && Number.isFinite(hCells) && wCells > 0 && hCells > 0) {
                return { wCells, hCells };
            }
        }

        return { wCells: 1, hCells: 1 };
    }

    function computeAnchoredSpriteLayerLayout(config) {
        if (!config || typeof config !== 'object') return null;
        const geometry = _resolveSpriteGeometry(config);
        if (!geometry) return null;
        const cellSizePx = geometry.cellSizePx;
        const gapPx = geometry.gapPx;
        const stepPx = geometry.stepPx;
        const rot = normalizeRotationIndex(config.rot);
        const rotGrid = _getRotationGrid(config.item, rot);

        const extents = getFullRotationGridExtents(config.item, rot);
        const wCells = Number(extents && extents.wCells);
        const hCells = Number(extents && extents.hCells);
        if (!Number.isFinite(wCells) || !Number.isFinite(hCells) || wCells <= 0 || hCells <= 0) return null;

        const derivedBodyBounds = computeBodyBoundsInFullGrid(rotGrid);
        const fallbackBodyBounds = config.bodyBounds && typeof config.bodyBounds === 'object'
            ? config.bodyBounds
            : null;
        const minC = derivedBodyBounds.hasBody
            ? Number(derivedBodyBounds.minC)
            : Number(fallbackBodyBounds && fallbackBodyBounds.minC);
        const minR = derivedBodyBounds.hasBody
            ? Number(derivedBodyBounds.minR)
            : Number(fallbackBodyBounds && fallbackBodyBounds.minR);
        const safeMinC = Number.isFinite(minC) ? minC : 0;
        const safeMinR = Number.isFinite(minR) ? minR : 0;
        const fullGridWidthPx = ((wCells - 1) * stepPx) + cellSizePx;
        const fullGridHeightPx = ((hCells - 1) * stepPx) + cellSizePx;
        const layerTranslatePx = {
            x: -(safeMinC * stepPx),
            y: -(safeMinR * stepPx)
        };
        const bodyBoundsInFullGrid = {
            minR: safeMinR,
            minC: safeMinC,
            maxR: derivedBodyBounds.hasBody ? Number(derivedBodyBounds.maxR) : safeMinR,
            maxC: derivedBodyBounds.hasBody ? Number(derivedBodyBounds.maxC) : safeMinC,
            hasBody: !!derivedBodyBounds.hasBody
        };
        const layout = {
            fullGridWCells: wCells,
            fullGridHCells: hCells,
            stepPx,
            fullGridWidthPx,
            fullGridHeightPx,
            layerTranslatePx,
            bodyBoundsInFullGrid
        };

        if (
            typeof globalScope !== 'undefined' &&
            globalScope.DEBUG_SPRITE_ANCHOR === true &&
            config.item &&
            config.item.id === 'pick_2'
        ) {
            const logKey = `${config.item.id}:${rot}`;
            if (!_loggedLayoutByItemRot[logKey]) {
                _loggedLayoutByItemRot[logKey] = true;
                console.log(`[SPRITE_ANCHOR][layout] item=${config.item.id} rot=${rot} layout=`, layout);
            }
        }

        return layout;
    }

    function computeAnchoredSpriteStyle(config) {
        if (!config || typeof config !== 'object') return null;

        const spriteAnchorCell = config.spriteAnchorCell;
        if (!spriteAnchorCell || typeof spriteAnchorCell !== 'object') return null;

        const rot = normalizeRotationIndex(config.rot);

        const geometry = _resolveSpriteGeometry(config);
        if (!geometry) return null;
        const cellSizePx = geometry.cellSizePx;
        const gapPx = geometry.gapPx;
        const stepPx = geometry.stepPx;

        const rot0Dims = _getRotationGridDimensions(config.item, 0);
        const rotatedAnchor = rotateCellFromRot0(
            spriteAnchorCell,
            rot,
            rot0Dims && rot0Dims.wCells,
            rot0Dims && rot0Dims.hCells
        ) || spriteAnchorCell;
        const anchorTargetX = Number(rotatedAnchor.x);
        const anchorTargetY = Number(rotatedAnchor.y);
        if (!Number.isFinite(anchorTargetX) || !Number.isFinite(anchorTargetY)) return null;

        let selectedBox = resolveSpriteBoxForRotation(config.spriteBox, config.spriteBoxByRot, rot);
        let dynamicMinC = 0;
        let dynamicMinR = 0;
        let boxSource = 'override';

        if (!selectedBox) {
            const boxCells = _computeItemSquareBoxCellsFromBody(config.item);
            if (!Number.isFinite(boxCells) || boxCells <= 0) return null;
            selectedBox = { wCells: boxCells, hCells: boxCells };
            const currentBounds = computeBodyBoundsInFullGrid(_getRotationGrid(config.item, rot));
            dynamicMinC = currentBounds.hasBody ? Number(currentBounds.minC) : 0;
            dynamicMinR = currentBounds.hasBody ? Number(currentBounds.minR) : 0;
            boxSource = 'computed-item-square';
        }

        const boxWCells = Number(selectedBox.wCells);
        const boxHCells = Number(selectedBox.hCells);
        if (!Number.isFinite(boxWCells) || !Number.isFinite(boxHCells) || boxWCells <= 0 || boxHCells <= 0) return null;
        const spriteScaleRaw = (config.item && boxSource === 'computed-item-square')
            ? Number(config.item.spriteScale)
            : 1;
        const spriteScale = (Number.isFinite(spriteScaleRaw) && spriteScaleRaw > 0)
            ? spriteScaleRaw
            : 1;

        const defaultAnchorInBoxCell = (boxSource === 'computed-item-square')
            ? { x: anchorTargetX - dynamicMinC, y: anchorTargetY - dynamicMinR }
            : { x: anchorTargetX, y: anchorTargetY };
        const anchorInBoxCell = (config.spriteAnchorInBoxCell && typeof config.spriteAnchorInBoxCell === 'object')
            ? config.spriteAnchorInBoxCell
            : defaultAnchorInBoxCell;
        const anchorInBoxX = Number(anchorInBoxCell.x);
        const anchorInBoxY = Number(anchorInBoxCell.y);
        if (!Number.isFinite(anchorInBoxX) || !Number.isFinite(anchorInBoxY)) return null;

        const targetAnchorPxX = (anchorTargetX * stepPx) + (cellSizePx / 2);
        const targetAnchorPxY = (anchorTargetY * stepPx) + (cellSizePx / 2);
        const anchorInSpritePxX = ((anchorInBoxX * stepPx) + (cellSizePx / 2)) * spriteScale;
        const anchorInSpritePxY = ((anchorInBoxY * stepPx) + (cellSizePx / 2)) * spriteScale;

        const offsetCells = (
            (config.item && config.item.spriteAnchorOffsetCells && typeof config.item.spriteAnchorOffsetCells === 'object')
                ? config.item.spriteAnchorOffsetCells
                : (config.spriteAnchorOffsetCells && typeof config.spriteAnchorOffsetCells === 'object' ? config.spriteAnchorOffsetCells : null)
        );
        const offsetCellsX = Number(offsetCells ? offsetCells.x : 0);
        const offsetCellsY = Number(offsetCells ? offsetCells.y : 0);
        const safeOffsetCellsX = Number.isFinite(offsetCellsX) ? offsetCellsX : 0;
        const safeOffsetCellsY = Number.isFinite(offsetCellsY) ? offsetCellsY : 0;
        const rotatedOffsetCells = rotateOffsetByRot(safeOffsetCellsX, safeOffsetCellsY, rot);
        const rotatedOffsetCellsX = rotatedOffsetCells.x;
        const rotatedOffsetCellsY = rotatedOffsetCells.y;

        let tx = targetAnchorPxX - anchorInSpritePxX;
        let ty = targetAnchorPxY - anchorInSpritePxY;

        tx += rotatedOffsetCellsX * cellSizePx;
        ty += rotatedOffsetCellsY * cellSizePx;

        const offsetPx = (config.spriteAnchorOffsetPx && typeof config.spriteAnchorOffsetPx === 'object')
            ? config.spriteAnchorOffsetPx
            : ((config.item && config.item.spriteAnchorOffsetPx && typeof config.item.spriteAnchorOffsetPx === 'object') ? config.item.spriteAnchorOffsetPx : null);
        const offsetX = readSpriteOffset(offsetPx ? offsetPx.x : 0);
        const offsetY = readSpriteOffset(offsetPx ? offsetPx.y : 0);
        tx += offsetX;
        ty += offsetY;

        const offsetItemPx = (
            (config.item && config.item.spriteAnchorOffsetItemPx && typeof config.item.spriteAnchorOffsetItemPx === 'object')
                ? config.item.spriteAnchorOffsetItemPx
                : (config.spriteAnchorOffsetItemPx && typeof config.spriteAnchorOffsetItemPx === 'object' ? config.spriteAnchorOffsetItemPx : null)
        );
        const offsetItemPxX = Number(offsetItemPx ? offsetItemPx.x : 0);
        const offsetItemPxY = Number(offsetItemPx ? offsetItemPx.y : 0);
        const safeOffsetItemPxX = Number.isFinite(offsetItemPxX) ? offsetItemPxX : 0;
        const safeOffsetItemPxY = Number.isFinite(offsetItemPxY) ? offsetItemPxY : 0;
        const rotatedOffsetItemPx = rotateOffsetByRot(safeOffsetItemPxX, safeOffsetItemPxY, rot);

        // Apply item-space pixel offset at the very end so it cannot be overwritten by later tx/ty changes.
        tx += rotatedOffsetItemPx.x;
        ty += rotatedOffsetItemPx.y;

        const transform = `translate(${tx}px, ${ty}px) rotate(${rot * 90}deg)`;
        if (
            typeof globalScope !== 'undefined' &&
            globalScope.DEBUG_SPRITE_ANCHOR === true &&
            config.item &&
            config.item.id === 'armor_new_2'
        ) {
            console.debug(
                `[SPRITE_ANCHOR][style] rot=${rot} rawOffsetItemPx=(${safeOffsetItemPxX},${safeOffsetItemPxY}) appliedItemOffsetPx=(${rotatedOffsetItemPx.x},${rotatedOffsetItemPx.y}) finalTranslatePx=(${tx},${ty}) transform="${transform}"`
            );
        }

        return {
            widthPx: boxWCells * stepPx * spriteScale,
            heightPx: boxHCells * stepPx * spriteScale,
            transformOrigin: `${anchorInSpritePxX}px ${anchorInSpritePxY}px`,
            transform,
            translatePx: { x: tx, y: ty },
            selectedSpriteBox: {
                wCells: boxWCells,
                hCells: boxHCells,
                source: boxSource,
                spriteScale
            },
            stepPx
        };
    }

    globalScope.SpriteAnchoring = {
        normalizeRotationIndex,
        isValidSpriteBox,
        resolveSpriteBoxForRotation,
        hasAnchoredSpriteMeta,
        computeBodyBoundsInFullGrid,
        getFullRotationGridExtents,
        computeAnchoredSpriteLayerLayout,
        computeAnchoredSpriteStyle
    };
})(typeof window !== 'undefined' ? window : null);

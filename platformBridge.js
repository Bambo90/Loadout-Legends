// platformBridge.js
// Runtime bridge so game code can stay platform-neutral (web now, desktop later).

(function initPlatformBridge(globalScope) {
    function getLocalStorageSafe() {
        try {
            return globalScope.localStorage || null;
        } catch (err) {
            return null;
        }
    }

    function detectRuntime() {
        const processObj = globalScope.process;
        const isElectronRenderer = !!(
            processObj &&
            processObj.versions &&
            processObj.versions.electron
        );
        return isElectronRenderer ? "electron" : "web";
    }

    const storage = {
        getItem(key) {
            const storageImpl = getLocalStorageSafe();
            if (!storageImpl) return null;
            try {
                return storageImpl.getItem(key);
            } catch (err) {
                console.warn("Storage read failed:", err);
                return null;
            }
        },
        setItem(key, value) {
            const storageImpl = getLocalStorageSafe();
            if (!storageImpl) return false;
            try {
                storageImpl.setItem(key, value);
                return true;
            } catch (err) {
                console.warn("Storage write failed:", err);
                return false;
            }
        },
        removeItem(key) {
            const storageImpl = getLocalStorageSafe();
            if (!storageImpl) return false;
            try {
                storageImpl.removeItem(key);
                return true;
            } catch (err) {
                console.warn("Storage delete failed:", err);
                return false;
            }
        }
    };

    globalScope.PlatformBridge = Object.freeze({
        runtime: detectRuntime(),
        storage
    });
})(window);


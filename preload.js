// preload.js
// Minimal, safe preload bridge for future desktop-specific integrations.

const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    runtime: "electron"
});


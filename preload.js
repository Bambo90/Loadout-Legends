// preload.js
// Minimal, safe preload bridge for future desktop-specific integrations.

const { contextBridge } = require("electron");

function readFlagFromArgv(flagName) {
    const prefix = `--${flagName}=`;
    const match = (process.argv || []).find((arg) => typeof arg === "string" && arg.startsWith(prefix));
    if (!match) return null;
    return match.slice(prefix.length).trim().toLowerCase();
}

const devToolsEnabled = readFlagFromArgv("ll-dev-tools") === "1";

contextBridge.exposeInMainWorld("electronAPI", Object.freeze({
    runtime: "electron",
    devToolsEnabled
}));

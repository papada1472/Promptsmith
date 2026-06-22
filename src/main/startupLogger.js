import { app } from "electron";
import fs from "fs";
import path from "path";

const LOG_DIR = "logs";
const LOG_FILE = "startup.log";

// Resolve log directory: try APPDATA first, fall back to TEMP
function getLogDir() {
  try {
    const userDataPath = app.getPath("userData");
    return path.join(userDataPath, LOG_DIR);
  } catch {
    return path.join(process.env.TEMP || "C:\\Temp", "Refinzi", LOG_DIR);
  }
}

let _logDir = null;
function ensureLogDir() {
  if (_logDir) return _logDir;
  _logDir = getLogDir();
  try {
    if (!fs.existsSync(_logDir)) {
      fs.mkdirSync(_logDir, { recursive: true });
    }
  } catch {
    // ignore
  }
  return _logDir;
}

function getLogPath() {
  return path.join(ensureLogDir(), LOG_FILE);
}

export function clearStartupLog() {
  _logDir = null; // reset cache for next init
  try {
    const p = path.join(getLogDir(), LOG_FILE);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  } catch {
    // ignore
  }
}

export function appendToStartupLog(message) {
  const logPath = getLogPath();
  try {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(logPath, line, "utf-8");
  } catch (err) {
    console.error("[StartupLogger] Failed to write log:", err?.message || err);
  }
  // Always echo to console for visibility
  console.log(message);
}
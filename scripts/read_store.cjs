const { app } = require("electron");
const Store = require("electron-store");
const crypto = require("crypto");

try {
  const key = crypto.createHash("sha256").update(app.getPath("userData")).digest("hex");
  const store = new Store({ name: "refinzi", encryptionKey: key });

  console.log("=== refinementLogs (last 3 entries) ===");
  const logs = store.get("refinementLogs") || [];
  console.log(JSON.stringify(logs.slice(-3), null, 2));
  console.log("Total entries:", logs.length);

  console.log("\n=== analyticsEvents (last 3 entries) ===");
  const events = store.get("analyticsEvents") || [];
  console.log(JSON.stringify(events.slice(-3), null, 2));
  console.log("Total entries:", events.length);

  console.log("\n=== metrics ===");
  console.log(JSON.stringify(store.get("metrics"), null, 2));
} catch (e) {
  console.error("Error:", e.message);
}
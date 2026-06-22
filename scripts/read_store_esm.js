import { app } from "electron";
import Store from "electron-store";
import crypto from "crypto";
import path from "path";

// Ensure app name matches the main application so path and encryption key align
app.name = "Refinzi";

app.whenReady().then(() => {
  try {
    const userData = app.getPath("userData");
    console.log("userData path:", userData);

    const key = crypto.createHash("sha256").update(userData).digest("hex");
    const store = new Store({ name: "refinzi", encryptionKey: key });

    console.log("onboardingSeen:", store.get("onboardingSeen"));
    console.log("lastRefinement:", JSON.stringify(store.get("lastRefinement"), null, 2));
    console.log("telemetryLogs count:", (store.get("telemetryLogs") || []).length);
    console.log("telemetryLogs last 3 entries:", JSON.stringify((store.get("telemetryLogs") || []).slice(-3), null, 2));
  } catch (e) {
    console.error("Error:", e.stack);
  }
  app.quit();
});

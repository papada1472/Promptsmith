const { execSync } = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const homeDir = process.env.USERPROFILE || "C:\\Users\\QEnic";
const cacheDir = path.join(homeDir, "AppData", "Local", "electron-builder", "Cache", "winCodeSign");
const sevenZip = path.join(process.cwd(), "node_modules", "7zip-bin", "win", "x64", "7za.exe");
const tempDir = path.join(process.env.TEMP, "wcs-repack");
const archiveUrl = "https://github.com/electron-userland/electron-builder-binaries/releases/download/winCodeSign-2.6.0/winCodeSign-2.6.0.7z";
const downloadedArchive = path.join(process.env.TEMP, "wcs-original.7z");

// Clean up
if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
fs.mkdirSync(tempDir, { recursive: true });

// Download
console.log("Downloading winCodeSign...");
if (!fs.existsSync(downloadedArchive)) {
  execSync(
    `powershell -Command "$wc = New-Object System.Net.WebClient; $wc.DownloadFile('${archiveUrl}', '${downloadedArchive}')"`,
    { stdio: "inherit", shell: "cmd.exe" }
  );
}

// List contents of archive first
console.log("\nListing archive contents...");
try {
  const listResult = execSync(`"${sevenZip}" l "${downloadedArchive}"`, { encoding: "utf8" });
  // Show just the entries that have errors
  const lines = listResult.split("\n");
  lines.forEach((line) => {
    if (line.includes("libcrypto") || line.includes("libssl") || line.includes("D....")) {
      console.log(line.trimEnd());
    }
  });
} catch (e) {
  console.log("Listing worked (errors in listing are expected)");
}

// Extract to temp (ignore symlink errors)
console.log("\nExtracting archive (ignoring symlink errors)...");
try {
  execSync(`"${sevenZip}" x "${downloadedArchive}" -o"${tempDir}" -y`, {
    stdio: "pipe",
    encoding: "utf8",
  });
} catch (e) {
  // Expected - symlink errors
}

// Find the root directory
function findRoot(dir) {
  try {
    const items = fs.readdirSync(dir);
    // Check if this looks like a root (has key directories)
    const hasWindowsDir = fs.existsSync(path.join(dir, "windows-10"));
    if (hasWindowsDir) return dir;
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      if (fs.statSync(fullPath).isDirectory()) {
        const result = findRoot(fullPath);
        if (result) return result;
      }
    }
  } catch (e) {}
  return null;
}

const rootDir = findRoot(tempDir);
if (!rootDir) {
  console.error("Could not find extracted root!");
  // List what we have
  function listAll(dir, depth = 0) {
    if (depth > 2) return;
    try {
      for (const item of fs.readdirSync(dir)) {
        const full = path.join(dir, item);
        const stat = fs.lstatSync(full);
        console.log("  ".repeat(depth) + (stat.isDirectory() ? "[D]" : "[F]") + " " + item);
        if (stat.isDirectory()) listAll(full, depth + 1);
      }
    } catch (e) {}
  }
  listAll(tempDir);
  process.exit(1);
}
console.log("Root directory:", rootDir);

// Remove darwin (has problematic symlinks)
const darwinDir = path.join(rootDir, "darwin");
if (fs.existsSync(darwinDir)) {
  console.log("Removing darwin directory (symlinks)...");
  fs.rmSync(darwinDir, { recursive: true, force: true });
}

// Also remove linux (not needed)
const linuxDir = path.join(rootDir, "linux");
if (fs.existsSync(linuxDir)) {
  console.log("Removing linux directory...");
  fs.rmSync(linuxDir, { recursive: true, force: true });
}

// Create the cache directory with hash
// The hash dir is SHA256 of downloaded file content
const fileContent = fs.readFileSync(downloadedArchive);
const sha256 = crypto.createHash("sha256").update(fileContent).digest("hex");
const hashDir = parseInt(sha256.substring(0, 9), 16).toString();
const targetDir = path.join(cacheDir, hashDir);

console.log("\nCreating cached version at:", targetDir);
if (fs.existsSync(targetDir)) fs.rmSync(targetDir, { recursive: true, force: true });
fs.mkdirSync(targetDir, { recursive: true });

// Copy contents
function copyRecursive(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const item of fs.readdirSync(src)) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    try {
      const stat = fs.lstatSync(srcPath);
      if (stat.isDirectory()) {
        copyRecursive(srcPath, destPath);
      } else if (stat.isFile()) {
        fs.copyFileSync(srcPath, destPath);
      }
      // Skip symlinks
    } catch (e) {}
  }
}

copyRecursive(rootDir, targetDir);
console.log("Done! Created cache at:", targetDir);

// Verify
const files = fs.readdirSync(targetDir, { recursive: true });
console.log("Files:", files.length);
files.slice(0, 20).forEach((f) => console.log("  -", f));

// Clean up
try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
console.log("\nNow run: npm run dist");
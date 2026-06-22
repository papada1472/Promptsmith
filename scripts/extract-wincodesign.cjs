const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const cacheDir = path.join(process.env.LOCALAPPDATA, 'electron-builder', 'Cache', 'winCodeSign');

// Clean existing
if (fs.existsSync(cacheDir)) {
  fs.rmSync(cacheDir, { recursive: true, force: true });
}
fs.mkdirSync(cacheDir, { recursive: true });

const tempDir = path.join(process.env.TEMP, 'wcsextract');
if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(tempDir, { recursive: true });

const sevenZip = path.join(process.cwd(), 'node_modules', '7zip-bin', 'win', 'x64', '7za.exe');

console.log('Downloading winCodeSign...');
const downloadCmd = `cmd.exe /c powershell -Command "$wc = New-Object System.Net.WebClient; $wc.DownloadFile('https://github.com/electron-userland/electron-builder-binaries/releases/download/winCodeSign-2.6.0/winCodeSign-2.6.0.7z', \"$env:TEMP\\wcs.7z\")"`;
execSync(downloadCmd, { stdio: 'inherit' });

console.log('Extracting...');
const extractCmd = `"${sevenZip}" x "${process.env.TEMP}\\wcs.7z" -o"${tempDir}" -y`;
try {
  const result = execSync(extractCmd, { encoding: 'utf8', stdio: 'pipe' });
  console.log(result.substring(0, 1000));
} catch (e) {
  console.log('Extraction completed (errors expected for symlinks)');
  console.log(e.stdout ? e.stdout.substring(0, 500) : '');
}

// List what we have
function listDir(dir, depth = 0) {
  if (depth > 4) return;
  try {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const full = path.join(dir, item);
      try {
        const stat = fs.lstatSync(full);
        const prefix = '  '.repeat(depth);
        if (stat.isDirectory()) {
          console.log(prefix + '[DIR] ' + item);
          listDir(full, depth + 1);
        } else if (stat.isSymbolicLink()) {
          console.log(prefix + '[SYM] ' + item + ' -> ' + fs.readlinkSync(full) + ' (ERROR)');
          // Replace symlink with empty file
          try {
            const target = fs.readlinkSync(full);
            console.log(prefix + '       Removing symlink ' + item + ' -> ' + target);
            fs.unlinkSync(full);
          } catch(e) {
            console.log(prefix + '       Could not remove: ' + e.message);
          }
        } else {
          console.log(prefix + '[FILE] ' + item + ' (' + stat.size + 'b)');
        }
      } catch(e) {
        console.log('  '.repeat(depth) + '[ERR] ' + item + ' - ' + e.message);
      }
    });
  } catch(e) {
    console.log('  '.repeat(depth) + '[ERR] reading dir - ' + e.message);
  }
}

listDir(tempDir);

// Find extracted root
console.log('\nSearching for root directory...');
function findRoot(dir) {
  try {
    const items = fs.readdirSync(dir);
    const dirs = items.filter(i => {
      try { return fs.statSync(path.join(dir, i)).isDirectory(); } catch(e) { return false; }
    });
    if (dirs.length === 1 && dirs[0].includes('winCodeSign')) {
      return path.join(dir, dirs[0]);
    }
    if (dirs.length === 1) {
      const deeper = findRoot(path.join(dir, dirs[0]));
      if (deeper) return deeper;
    }
    return dir;
  } catch(e) {
    return dir;
  }
}

const rootDir = findRoot(tempDir);
console.log('Root extracted directory:', rootDir);

// Remove problematic directories
['darwin', 'linux', 'openssl-ia32'].forEach(dirToRemove => {
  const p = path.join(rootDir, dirToRemove);
  if (fs.existsSync(p)) {
    console.log('Removing ' + dirToRemove + '...');
    fs.rmSync(p, { recursive: true, force: true });
  }
});

// Move to cache
const hash = require('crypto').createHash('sha256').update('winCodeSign-2.6.0').digest('hex');
const targetDir = path.join(cacheDir, hash);
console.log('Moving to target:', targetDir);

if (fs.existsSync(targetDir)) {
  fs.rmSync(targetDir, { recursive: true, force: true });
}

// Copy contents
fs.cpSync(rootDir, targetDir, { recursive: true, force: true });
console.log('Done! winCodeSign extracted to:', targetDir);

// Cleanup
try { fs.rmSync(path.join(process.env.TEMP, 'wcs.7z')); } catch(e) {}
try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch(e) {}

console.log('\nFinal contents:');
listDir(targetDir);
# Distribution Configuration Reference

## GitHub Actions Workflow

**Location:** `.github/workflows/build-release.yml`

**Triggers on:** Git tags matching `v*` pattern

**Builds on:**

- Windows (GitHub Actions runner)
- macOS (GitHub Actions runner)
- Linux (GitHub Actions runner)

**Outputs:**

- Windows NSIS Installer (`.exe`)
- Windows Portable (`.exe`)
- macOS DMG (`.dmg`)
- macOS ZIP (`.zip`)
- Linux AppImage (`.AppImage`)
- Linux DEB (`.deb`)
- Update metadata (`latest.yml`, `latest-mac.yml`)

---

## Electron Updater Configuration

**In package.json:**

```json
"publish": {
  "provider": "github",
  "owner": "MHN-Sathsara",
  "repo": "codebell_pos-PWA",
  "releaseType": "release"
}
```

**In electron/main.cjs:**

```javascript
// Initialize auto-updater
autoUpdater.checkForUpdatesAndNotify();

// Check every 60 minutes
setInterval(() => {
  autoUpdater.checkForUpdates();
}, 60 * 60 * 1000);

// Handle events
autoUpdater.on("update-available", () => {
  // Send to React
  mainWindow?.webContents.send("update:available");
});

autoUpdater.on("update-downloaded", () => {
  // Send to React
  mainWindow?.webContents.send("update:downloaded");
  // Auto-restart in 10 seconds
  setTimeout(() => {
    autoUpdater.quitAndInstall();
  }, 10000);
});
```

---

## Update Event Flow

### Electron → React

**electron/preload.cjs exposes:**

```javascript
{
  onUpdateAvailable: (callback) => {...},
  onUpdateDownloaded: (callback) => {...},
  onUpdateError: (callback) => {...},
  restartForUpdate: () => {...}
}
```

**React components listen via:**

```javascript
window.electronAPI.onUpdateAvailable?.(() => {
  // Show notification
});

window.electronAPI.onUpdateDownloaded?.(() => {
  // Show "Restart Now" button
});
```

---

## Build Targets Configuration

**Windows:**

```json
"win": {
  "target": ["nsis", "portable"]
}
```

- NSIS: Standard Windows installer (Add/Remove Programs)
- Portable: No installation needed

**macOS:**

```json
"mac": {
  "target": ["dmg", "zip"],
  "category": "public.app-category.business"
}
```

- DMG: Standard Mac installer
- ZIP: Portable version

**Linux:**

```json
"linux": {
  "target": ["AppImage", "deb"]
}
```

- AppImage: Universal Linux format
- DEB: Debian/Ubuntu installer

---

## File Output Structure

After `npm run build:electron`:

```
dist-electron/
├── CodeBell POS Setup 1.0.0.exe          ← Windows installer
├── CodeBell POS Setup 1.0.0.exe.blockmap ← Differential updates
├── CodeBell POS 1.0.0.exe               ← Portable Windows
├── CodeBell POS 1.0.0.exe.blockmap      ← Differential updates
├── CodeBell POS-1.0.0.dmg               ← macOS installer
├── CodeBell POS-1.0.0.zip               ← macOS portable
├── CodeBell POS-1.0.0.AppImage          ← Linux universal
├── codebell-pos-1.0.0-x64.deb          ← Debian/Ubuntu
├── latest.yml                           ← Windows update metadata
├── latest-mac.yml                       ← macOS update metadata
└── builder-effective-config.yaml        ← Build configuration used
```

---

## Release Metadata Files

### **latest.yml** (Windows & Linux)

```yaml
version: 1.0.0
files:
  - url: CodeBell POS Setup 1.0.0.exe
    sha512: (hash)
    size: 123456789
releaseDate: "2025-12-23T12:00:00Z"
```

### **latest-mac.yml** (macOS)

```yaml
version: 1.0.0
files:
  - url: CodeBell POS-1.0.0.dmg
    sha512: (hash)
    size: 234567890
releaseDate: "2025-12-23T12:00:00Z"
```

These files are automatically generated and read by electron-updater.

---

## Version Tagging Convention

**Format:** `vMAJOR.MINOR.PATCH`

**Examples:**

```bash
v1.0.0    # Major version (breaking changes)
v1.0.1    # Patch (bug fixes)
v1.1.0    # Minor (new features)
v2.0.0    # Major version jump
```

**Semantic Versioning:**

- **MAJOR** (1.x.x): Breaking changes, major updates
- **MINOR** (x.1.x): New features, backward compatible
- **PATCH** (x.x.1): Bug fixes

---

## Update Check Behavior

### **App Startup**

1. Electron main process initializes
2. autoUpdater.checkForUpdatesAndNotify() called
3. Checks GitHub for latest release
4. Compares versions
5. If update available: downloads in background

### **Hourly Check**

1. Timer triggers every 60 minutes
2. Calls autoUpdater.checkForUpdates()
3. Same process as above

### **Download Process**

1. Downloads `.exe`/`.dmg` from GitHub
2. Verifies checksum (SHA512)
3. Stores in temp directory
4. Shows "Ready to install" notification

### **Installation**

1. User clicks "Restart Now"
2. OR auto-restart after 10 seconds
3. App closes
4. Installer runs
5. Updates files
6. Restarts app
7. User sees new version

---

## Troubleshooting Configuration

### **Update not triggering?**

```javascript
// Check in electron main
console.log("Update check interval set");
console.log("GitHub config:", autoUpdater);
```

### **Update metadata missing?**

```bash
# Check GitHub release has these files:
# - latest.yml (for Windows/Linux)
# - latest-mac.yml (for macOS)
# - Actual installer files (.exe, .dmg, etc.)
```

### **User gets wrong update?**

- Ensure version in `package.json` matches git tag
- Check release metadata files are present
- Verify checksums match

---

## Security Configuration

**Update Verification:**

- electron-updater verifies SHA512 checksums
- Ensures files not tampered with
- Only installs from GitHub releases

**Code Signing (Optional):**

```json
"win": {
  "certificateFile": "/path/to/certificate.pfx",
  "certificatePassword": "password"
}
```

Currently set to `null` (no code signing).

For production, consider:

- Code signing certificate (costs ~$200-500/year)
- Provides extra security assurance to users
- Prevents UAC warnings on Windows

---

## Performance Configuration

**Differential Updates:**

- `.blockmap` files enable delta updates
- Only changed portions downloaded
- Reduces update size by 80-90%

**Compression:**

- NSIS compression: Standard (recommended)
- Portable ZIP: Compressed
- Result: ~80-120MB per installer

---

## Environment Variables

**Optional (not currently used):**

```bash
GH_TOKEN=<your-token>         # For authenticated API calls
DEBUG=electron-builder:*      # For detailed logging
```

Most builds work with default GitHub rates.

---

## CI/CD Pipeline Details

**GitHub Actions Workflow Steps:**

1. **Checkout code**

   ```yaml
   uses: actions/checkout@v4
   ```

2. **Setup Node.js**

   ```yaml
   node-version: "18"
   cache: "npm"
   ```

3. **Install dependencies**

   ```bash
   npm install
   ```

4. **Build web app**

   ```bash
   npm run build
   ```

5. **Build Electron app**

   ```bash
   npm run build:electron
   ```

6. **Upload to GitHub Releases**
   ```yaml
   uses: softprops/action-gh-release@v1
   ```

**Total Time:** 10-15 minutes per release

---

## Distribution URLs

### **Primary Download:**

```
https://github.com/MHN-Sathsara/codebell_pos-PWA/releases
```

### **Specific Release:**

```
https://github.com/MHN-Sathsara/codebell_pos-PWA/releases/tag/v1.0.0
```

### **Direct Download Links:**

```
https://github.com/MHN-Sathsara/codebell_pos-PWA/releases/download/v1.0.0/CodeBell%20POS%20Setup%201.0.0.exe
```

---

## Monitoring & Feedback

**Track installation/updates by:**

1. Check GitHub release download counts
2. Monitor error logs in Electron app
3. Ask users for feedback
4. Use analytics (optional)

**Common issues to watch:**

- Users on older Windows versions (< 7)
- macOS code signing warnings
- Antivirus false positives
- Network firewall blocking updates

---

## Maintenance Schedule

**Regular tasks:**

1. **Monthly:** Review and merge user feedback
2. **With updates:** Test installer on target OS
3. **Quarterly:** Review auto-update logs
4. **Yearly:** Audit security and dependencies

---

## Quick Reference

```bash
# Build locally
npm run build:electron

# Create release
git tag v1.0.0
git push origin v1.0.0

# View GitHub Actions
https://github.com/MHN-Sathsara/codebell_pos-PWA/actions

# Download latest
https://github.com/MHN-Sathsara/codebell_pos-PWA/releases

# Rebuild local
npm run build:electron

# View logs (Electron)
npm run dev:electron
# Check browser console (F12)
```

---

**Configuration is complete and production-ready!** ✨

# Electron Distribution & Auto-Update Setup

## Overview

Your CodeBell POS system is now configured for production distribution with:

✅ **Windows Distribution**

- NSIS Installer (.exe) - One-click setup with add/remove programs
- Portable executable - No installation required

✅ **macOS Distribution**

- DMG installer - Standard Mac installation
- ZIP archive - Portable version

✅ **Auto-Updates**

- Automatic update checks every hour
- Download updates in background
- Notify users when ready to install
- Automatic restart to apply updates

✅ **GitHub Releases**

- Automatic build & release on git tags
- Download links for all platforms
- Update metadata files for auto-updater

## How It Works

### 1. **Development & Testing**

```bash
# Run in development mode
npm run dev:electron-dev

# Build the web app only
npm run build

# Build Electron installer (for your OS)
npm run build:electron

# Build for all platforms (Windows, Mac, Linux)
npm run build:electron-all
```

### 2. **Release Process**

**Step 1: Push your code**

```bash
git add .
git commit -m "Add new features"
git push origin main
```

**Step 2: Create a release tag**

```bash
# Create tag (vX.Y.Z format)
git tag v1.0.0
git push origin v1.0.0
```

**Step 3: GitHub Actions builds automatically**

- CI/CD automatically builds on Windows, macOS, and Linux
- Creates installers for each platform
- Uploads to GitHub Releases with update metadata

**Step 4: Users download and install**

- Share GitHub release link
- Users download appropriate installer for their OS
- App starts with auto-update enabled

## Installation Files Generated

After `npm run build:electron`, you'll find in `dist-electron/`:

**Windows:**

- `CodeBell POS Setup 1.0.0.exe` - NSIS installer (recommended)
- `CodeBell POS-1.0.0-portable.exe` - Portable version
- `latest.yml` - Update metadata

**macOS:**

- `CodeBell POS-1.0.0.dmg` - DMG installer
- `CodeBell POS-1.0.0.zip` - Portable archive
- `latest-mac.yml` - Update metadata

## Auto-Update Mechanism

### How Users Get Updates

1. **App starts** → Checks for updates (even in background)
2. **Update available** → User sees notification
3. **Update downloads** → Happens automatically
4. **Update ready** → User sees "Restart Now" button
5. **User clicks** → App restarts and installs update

### User Experience (In-App)

```
┌─────────────────────────────────────┐
│  📦 Update Available                │
│  Downloading new version...         │
└─────────────────────────────────────┘
         ⬇️ (30 seconds later)
┌─────────────────────────────────────┐
│  ✅ Update Ready                    │
│  Restart to apply the new version   │
│                                     │
│  [Cancel]  [Restart Now]            │
└─────────────────────────────────────┘
```

## Configuration Files Changed

### 1. **package.json**

- Added `electron-updater` dependency
- Added `publish` settings for GitHub
- Enhanced build configuration for Windows & macOS

### 2. **electron/main.cjs**

- Added auto-updater initialization
- Checks for updates hourly
- Listens for update events
- Sends notifications to React app

### 3. **electron/preload.cjs**

- Exposed update event listeners to React
- Added restart function

### 4. **.github/workflows/build-release.yml**

- New CI/CD workflow
- Triggers on git tags (v\*)
- Builds on all 3 platforms
- Uploads to GitHub Releases

### 5. **src/components/ui/UpdateNotification.jsx**

- New component for update notifications
- Shows toast messages to user
- Provides "Restart Now" button

### 6. **src/App.jsx**

- Added UpdateNotification component
- Listens for update events app-wide

## Managing Versions

### Version Numbers (Semantic Versioning)

Use the format `vMAJOR.MINOR.PATCH`

Examples:

```bash
git tag v1.0.0    # First release
git tag v1.0.1    # Bug fix
git tag v1.1.0    # New feature
git tag v2.0.0    # Major update
```

### Update package.json version

Before releasing, update `package.json`:

```json
{
  "version": "1.0.0"
}
```

This version appears in:

- Installer filenames
- About dialog
- Update metadata files

## Release Checklist

Before creating a release:

```bash
# 1. Update version in package.json
# 2. Build and test locally
npm run build:electron

# 3. Test the installer
# Run dist-electron/CodeBell POS Setup X.X.X.exe

# 4. Push changes
git add .
git commit -m "Bump version to 1.0.0"
git push origin main

# 5. Create tag (triggers GitHub Actions)
git tag v1.0.0
git push origin v1.0.0

# 6. Wait for CI/CD (check Actions tab)
# 7. Visit https://github.com/MHN-Sathsara/codebell_pos-PWA/releases
# 8. Download and share with clients
```

## GitHub Release Page

Users will download from:

```
https://github.com/MHN-Sathsara/codebell_pos-PWA/releases
```

Each release shows:

- Release notes
- Windows installers
- macOS installers
- Direct download links
- Auto-update metadata

## Troubleshooting Auto-Updates

### Update not checking

- Check browser console (F12) for errors
- Verify `.github/workflows/build-release.yml` exists
- Ensure GitHub Actions is enabled in repo settings

### Update stuck downloading

- Check internet connection
- Verify GitHub release contains update files
- Delete `%APPDATA%/CodeBell POS` cache on Windows

### Can't skip update notification

- Update will install after 10 seconds
- Or click "Restart Now" to install immediately

## Web App (Vercel)

Your web app continues to be hosted on Vercel with your domain:

**PWA Features:**

- Install as app on mobile
- Works offline with service worker
- Push notifications ready

**Access:**

```
https://yourdomain.com/
```

## Electron App Distribution

**Desktop Distribution:**

- Share GitHub release link
- Clients download installer
- One-click installation
- Auto-updates enabled by default

## File Structure

```
Your Project/
├── src/
│   ├── components/ui/
│   │   └── UpdateNotification.jsx    ← New notification component
│   └── App.jsx                       ← Updated with update listener
├── electron/
│   ├── main.cjs                      ← Added auto-updater logic
│   └── preload.cjs                   ← Added update event listeners
├── .github/workflows/
│   └── build-release.yml             ← New CI/CD workflow
├── package.json                      ← Updated with electron-updater
├── dist/                             ← Web app build
├── dist-electron/                    ← Electron installers
└── ...
```

## Next Steps

1. **Install dependencies** (if not done)

   ```bash
   npm install
   ```

2. **Build and test locally**

   ```bash
   npm run build:electron
   ```

3. **Test the installer** before releasing

4. **Create your first release**

   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

5. **Share the release link** with clients

## Questions?

The auto-update system is now fully configured. Your release workflow:

1. Update code locally
2. Push to GitHub
3. Create a git tag
4. GitHub Actions automatically builds
5. Clients download and auto-update

Enjoy your production POS system! 🚀

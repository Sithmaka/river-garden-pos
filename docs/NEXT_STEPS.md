# Quick Start Guide - What to Do Next

## 🎯 Immediate Next Steps (Phase 3)

### Step 1: Generate PWA Icons

You need 3 icon files. Use any of these tools:

- https://www.pwabuilder.com/ (Recommended)
- https://favicon.io/
- ImageMagick: `convert logo.png -resize 192x192 icon-192x192.png`

**Required Icons:**

- `public/icons/icon-192x192.png` (192x192 pixels)
- `public/icons/icon-512x512.png` (512x512 pixels)
- `public/icons/apple-touch-icon.png` (180x180 pixels)

Place them in the `public/icons/` folder.

---

### Step 2: Install New Dependencies

```bash
npm install
```

This will install:

- vite-plugin-pwa
- workbox-core, workbox-precache, workbox-routing, workbox-strategies

---

### Step 3: Build and Test

```bash
# Build the PWA
npm run build

# Preview the build locally
npm run preview
```

Open http://localhost:4173 and check:

1. DevTools > Application > Manifest - Should show the PWA manifest
2. DevTools > Application > Service Workers - Should show registered
3. Address bar - Should show "Install" button (may not show on first visit)

---

## 🗑️ Phase 3: Remove QZ Tray (Optional but Recommended)

Delete these files as QZ Tray is no longer needed:

```bash
# Service and diagnostics files
rm src/services/qzTrayService.js
rm src/pages/QZTrayDiagnostics.jsx

# QZ Tray setup scripts
rm scripts/setup-override-crt.ps1
rm scripts/setup-override-crt.sh
rm scripts/verify-qz-setup.js

# QZ Tray certificates
rm -rf public/certs/
```

Then remove from `.env` file:

```
# These can be deleted:
VITE_CERT_PATH=
VITE_QZ_TRAY_URL=
VITE_QZ_TRAY_PORT=
```

---

## 📋 Feature Testing Checklist

Once you have the app running:

### PWA Installation

- [ ] Click install button when available
- [ ] App installs successfully
- [ ] App launches from start menu / launchpad
- [ ] Works offline (toggle offline in DevTools)

### Printer Testing

Go to Admin > Printer Diagnostics or `/admin/printer-diagnostics`

- [ ] Browser Print works
- [ ] System Default Printer is listed
- [ ] Test print button works
- [ ] Can select and print from receipt page

### Receipt Printing

On Cashier Dashboard:

- [ ] Select a printer from dropdown
- [ ] Place an order
- [ ] Click "Print Customer Receipt"
- [ ] Receipt prints to selected printer

---

## 🔗 Useful Commands

```bash
# Clear npm cache if having issues
npm cache clean --force

# Update all dependencies safely
npm update

# Check for outdated packages
npm outdated

# Audit security vulnerabilities
npm audit

# Fix vulnerabilities automatically (if possible)
npm audit fix
```

---

## 📱 PWA Installation Methods

After building:

### Windows

1. Open the app in Chrome/Edge
2. Click the "Install" button in address bar
3. Confirm installation
4. App appears in Start Menu

### Mac

1. Open the app in Chrome/Safari
2. Use browser menu: Share > Add to Dock
3. App appears in Dock

### Linux

1. Open the app in Chrome
2. Click the "Install" button
3. App appears in applications menu

---

## 🧪 Testing Offline Functionality

1. Open DevTools (F12)
2. Go to Application > Service Workers
3. Check "Offline" checkbox
4. Refresh the page
5. App should still load (with cached assets)

---

## 📞 Troubleshooting

### PWA not installing?

- Check if HTTPS is used (localhost is exception)
- Check manifest.json in DevTools > Application
- Check Service Worker is registered and active

### Printers not detected?

- Check browser console for errors
- Some browsers require permissions for USB
- "Browser Print" should always be available

### Build errors?

```bash
# Try clean rebuild
rm -rf node_modules dist
npm install
npm run build
```

---

## 📝 Configuration Files Created

- `pwa-config.js` - PWA manifest and workbox config
- `src/serviceWorker.js` - Service worker setup
- `src/services/printerService.js` - Printer management
- `src/services/directPrinterService.js` - Direct printing API
- `src/components/ui/PrinterSelector.jsx` - UI component
- `src/pages/PrinterDiagnostics.jsx` - Diagnostics page

---

## ✨ Key Features Now Available

✅ **PWA Installation** - Install app from browser  
✅ **Offline Support** - Works without internet (cached assets)  
✅ **Direct Printing** - No QZ Tray needed  
✅ **Multiple Printers** - Browser, System, USB  
✅ **Printer Diagnostics** - Test and troubleshoot  
✅ **One-Click Setup** - PWA auto-generates manifest

---

**You're ready to go! Follow the steps above to complete the migration.** 🚀

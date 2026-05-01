# Developer Quick Reference

**Purpose**: Fast lookup guide for CodeBell POS PWA migration  
**Audience**: Developers implementing or maintaining the app

---

## 🚀 Quick Commands

```bash
# Setup
npm install
cp .env.example .env.local  # Edit with your credentials

# Development
npm run dev          # Start dev server (http://localhost:5173)
npm run lint         # Check code quality

# Build & Preview
npm run build        # Create optimized build
npm run preview      # Preview production build locally

# Database
npm run seed         # Seed initial data (if needed)
```

---

## 📁 Key File Locations

| Purpose         | File                                    | Lines | Status      |
| --------------- | --------------------------------------- | ----- | ----------- |
| PWA Config      | `pwa-config.js`                         | 25    | ✅          |
| Service Worker  | `src/serviceWorker.js`                  | 70    | ✅          |
| Printer Service | `src/services/directPrinterService.js`  | 287   | ✅          |
| Printer Wrapper | `src/services/printerService.js`        | 61    | ✅          |
| Printer UI      | `src/components/ui/PrinterSelector.jsx` | 179   | ✅          |
| Diagnostics     | `src/pages/PrinterDiagnostics.jsx`      | 252   | ✅          |
| Settings        | `src/pages/Settings.jsx`                | 566   | ✅ Modified |
| Order Entry     | `src/pages/CashierOrderEntry.jsx`       | -     | ✅ Modified |
| Main App        | `src/App.jsx`                           | -     | ✅ Modified |
| Vite Config     | `vite.config.js`                        | -     | ✅ Modified |
| HTML            | `index.html`                            | -     | ✅ Modified |
| Dependencies    | `package.json`                          | -     | ✅ Modified |

---

## 🔧 Common Tasks

### Add Printer Support to New Page

```jsx
// 1. Import
import printerService from "@/services/printerService";

// 2. Use in component
const handlePrint = async (html) => {
  try {
    await printerService.print("Customer Receipt", html, {});
    console.log("✅ Print successful");
  } catch (error) {
    console.error("❌ Print failed:", error);
  }
};

// 3. In JSX
<button onClick={() => handlePrint(receiptHTML)}>Print Receipt</button>;
```

### Test Printer Service

```bash
# 1. Navigate to diagnostics page
http://localhost:5173/admin/printer-diagnostics

# 2. Use the test interface:
# - Service Status shows connection
# - Printer List shows detected printers
# - Test Print button verifies functionality
```

### Debug PWA Issues

```javascript
// In browser console (F12)

// Check Service Worker
navigator.serviceWorker.getRegistrations();
// Should show: active Service Worker with status "activated"

// Check Manifest
fetch("/manifest.webmanifest").then((r) => r.json());
// Should show: app name, icons, display: "standalone"

// Check PWA readiness
if (window.matchMedia("(display-mode: standalone)").matches) {
  console.log("✅ Running as PWA");
} else {
  console.log("⚠️ Running in browser");
}
```

### Add New Environment Variable

```bash
# 1. Add to .env.example
VITE_MY_NEW_VAR=example_value

# 2. Add to .env.local
VITE_MY_NEW_VAR=actual_value

# 3. Use in code
const value = import.meta.env.VITE_MY_NEW_VAR;
```

### Check Build Size

```bash
npm run build
# Look for output: "dist/index-[hash].js 123.45 KB"
# Goal: Keep main bundle < 500KB
```

---

## 🗂️ Component Architecture

```
App.jsx
├── PWA Initialization
│   ├── registerServiceWorker()
│   └── checkPWAInstallPrompt()
├── Routes
│   ├── /login → LoginPage
│   ├── /dashboard → Dashboard
│   ├── /admin/settings → Settings (WITH PrinterSelector)
│   ├── /admin/printer-diagnostics → PrinterDiagnostics
│   └── /admin/orders → CashierOrderEntry (WITH print buttons)
└── Context Providers
    ├── AuthContext
    └── ThemeContext
```

---

## 📊 Data Flow

```
User Browser
    ↓
Service Worker (caches assets, handles offline)
    ↓
React App (UI & state)
    ↓
Printer Service (print abstraction)
    │
    ├─→ Browser Print (window.print)
    ├─→ System Printer (native OS)
    └─→ USB Thermal (WebUSB API)
    ↓
Supabase Client
    ↓
Database (persistence & auth)
```

---

## 🔑 Configuration

### pwa-config.js

```javascript
// Main PWA settings
{
  name: 'CodeBell POS',
  short_name: 'CodeBell',
  icons: [ /* 3 sizes */ ],
  theme_color: '#14b8a6',
  display: 'standalone'
}
```

### vite.config.js

```javascript
// Includes: VitePWA(pwaConfig)
// Auto-generates: dist/manifest.webmanifest, dist/sw.js
```

### .env.local (Create from .env.example)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-key
```

---

## 🧪 Testing Checklist

Quick verification:

- [ ] `npm run dev` works
- [ ] App loads at http://localhost:5173
- [ ] Login works
- [ ] Service Worker shows "running" (DevTools)
- [ ] Manifest loads (DevTools → Application)
- [ ] Printer Diagnostics loads
- [ ] Test Print button works
- [ ] Settings page loads
- [ ] `npm run build` succeeds
- [ ] `npm run preview` works

---

## 🐛 Debugging Tips

### Service Worker Not Registering

```javascript
// In console
navigator.serviceWorker.getRegistrations();
// If empty, check:
// 1. Not served over HTTPS (except localhost)
// 2. manifest.webmanifest not found
// 3. vite.config.js PWA plugin not added
```

### Printer Service Returns Empty

```javascript
// In console
printerService.getPrinters().then(console.log);
// Browser Print should always show
// System printers need OS configuration
// USB needs HTTPS and user permission
```

### App Shows Blank Page

```javascript
// In console
console.error(); // Shows error
// Usually: missing .env.local or Supabase connection
// Check: Network tab for 401/403 errors
```

### Build Fails

```bash
npm run build  # See actual error
# Common: missing file, syntax error, import issue
# Fix and retry: npm run build
```

---

## 📦 Dependencies Overview

| Package               | Version | Purpose      | Status     |
| --------------------- | ------- | ------------ | ---------- |
| react                 | 19.1.1  | UI framework | ✅ Current |
| react-router-dom      | 6.30.1  | Routing      | ✅ Current |
| @supabase/supabase-js | 2.78.0  | Database     | ✅ Current |
| tailwindcss           | 3.4.18  | Styling      | ✅ Current |
| vite                  | 6.4.1   | Build tool   | ✅ Pinned  |
| vite-plugin-pwa       | 0.21.0  | PWA          | ✅ Current |
| lucide-react          | 0.553.0 | Icons        | ✅ Current |

**Important**: Vite pinned at 6.4.1 (vite-plugin-pwa@0.21.0 incompatible with Vite 7)

---

## 🔐 Security Notes

- ✅ Never commit `.env.local`
- ✅ Keep API key in environment variables
- ✅ Supabase RLS policies protect data
- ✅ HTTPS required for production PWA
- ✅ Service Worker same-origin only
- ✅ WebUSB requires user permission

---

## 📈 Performance Tips

1. **Lazy load routes**: Use React.lazy for pages
2. **Code split**: Vite auto-splits vendor and app code
3. **Cache busting**: Vite handles with hashes
4. **Service Worker**: NetworkFirst caching (network then cache)
5. **Icons**: Use exact sizes (don't resize in browser)

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
vercel           # Deploy
vercel --prod    # Production
```

### Other Platforms

1. Build: `npm run build`
2. Upload: `dist/` folder
3. Configure: Serve `index.html` for all routes
4. Set environment variables via platform UI

---

## 📞 Getting Help

| Issue           | Location                          |
| --------------- | --------------------------------- |
| Setup questions | PHASE_5_QUICK_START.md            |
| Detailed guide  | PHASE_5_TESTING_GUIDE.md          |
| Architecture    | TECH_STACK.md                     |
| Deployment      | DEPLOYMENT.md, PHASE_6_ROADMAP.md |
| Code reference  | Inline comments in source files   |

---

## 🎯 Key URLs

| Resource           | URL                                             |
| ------------------ | ----------------------------------------------- |
| Dev Server         | http://localhost:5173                           |
| Production Preview | http://localhost:4173                           |
| Diagnostics        | http://localhost:5173/admin/printer-diagnostics |
| PWABuilder         | https://www.pwabuilder.com/                     |
| Supabase           | https://app.supabase.com/                       |
| Vite Docs          | https://vitejs.dev/                             |
| React Docs         | https://react.dev/                              |
| PWA Guide          | https://web.dev/progressive-web-apps/           |

---

## ✨ Pro Tips

1. **Hot Reload**: Edit `src/` files → page auto-refreshes in dev
2. **DevTools**: F12 → Application tab → check Service Worker, Cache, Manifest
3. **Network Tab**: See what's cached vs. fetched
4. **Offline Mode**: DevTools → Network → select "Offline"
5. **Clear Cache**: Right-click → Empty cache (Chrome)
6. **PWA Install**: Browser URL bar → Install app

---

## 📋 File Modification Log

### Phase 1-2: Foundation & Printer Service

- Created: 5 new files (~900 LOC)
- Modified: 3 core files (routing, config)
- Added: vite-plugin-pwa dependency

### Phase 3: QZ Tray Removal

- Deleted: 6 legacy files
- Modified: 5 files (removed QZ imports)
- Removed: qz-tray dependency

### Phase 4: UI Integration

- Modified: Settings.jsx (major redesign)
- Modified: App.jsx (routes)
- No files deleted or created

### Phase 5: Testing (Upcoming)

- Create: PWA icons (3 PNG files)
- Create: .env.local (from .env.example)
- No code changes

### Phase 6: Deployment (Upcoming)

- Push: All changes to git
- Deploy: dist/ folder to hosting
- Configure: Environment variables

---

## 🎓 Learning Path

1. **Understand PWA**: Read [TECH_STACK.md](TECH_STACK.md)
2. **Understand Printer Service**: Read source code in `src/services/`
3. **Understand Routing**: Check `src/App.jsx` and `src/pages/`
4. **Understand Build**: Run `npm run build` and inspect `dist/`
5. **Understand Deployment**: Read [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 🔗 Document Links

- [PHASE_5_QUICK_START.md](PHASE_5_QUICK_START.md) - 5-minute guide
- [PHASE_5_TESTING_GUIDE.md](PHASE_5_TESTING_GUIDE.md) - Complete guide
- [PHASE_5_COMPLETION_CHECKLIST.md](PHASE_5_COMPLETION_CHECKLIST.md) - Verification
- [MIGRATION_STATUS.md](MIGRATION_STATUS.md) - What's been done
- [PHASE_6_ROADMAP.md](PHASE_6_ROADMAP.md) - Deployment plan
- [TECH_STACK.md](TECH_STACK.md) - Technology details
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment info

---

**Last Updated**: December 23, 2025  
**Status**: Ready for Phase 5  
**Quick Links**: Use Ctrl+F to find topic

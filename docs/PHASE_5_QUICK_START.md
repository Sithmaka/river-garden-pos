# Phase 5 Quick Start - Testing & Icon Generation

## 🚀 Quick Setup (5 minutes)

### 1. Create .env.local

```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local with your Supabase credentials:
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-key-here
```

### 2. Generate PWA Icons

**Visit**: https://www.pwabuilder.com/

1. Click "Image Generator"
2. Upload your app icon (512×512 or larger)
3. Download the generated icons ZIP
4. Extract and copy 3 PNG files to: `public/icons/`

**Required files in `public/icons/`**:

- `icon-192x192.png`
- `icon-512x512.png`
- `apple-touch-icon.png`

### 3. Run Locally

```bash
# Development mode (hot reload, debugging)
npm run dev
# Then open: http://localhost:5173

# OR production mode (like real deployment)
npm run build
npm run preview
# Then open: http://localhost:4173
```

---

## ✅ Testing Checklist

### App Basics

- [ ] App loads in browser
- [ ] Login page appears
- [ ] Login works
- [ ] Dashboard loads

### PWA Features

- [ ] Install button appears in browser (URL bar or menu)
- [ ] Click install → app opens in standalone window
- [ ] Service Worker shows as "running" (DevTools → Application → Service Workers)
- [ ] Manifest loads (DevTools → Application → Manifest)

### Printer Services

- [ ] Settings page loads (`/admin/settings`)
- [ ] Printer status cards display
- [ ] Printer Diagnostics page works (`/admin/printer-diagnostics`)
- [ ] Test Print button works
- [ ] Print dialog opens correctly

### Offline Mode

- [ ] DevTools → Network → set to "Offline"
- [ ] App still functions (UI still works, cached pages load)
- [ ] Reconnect and sync resumes

### Database

- [ ] Printer selection saves
- [ ] Settings persist after logout/login
- [ ] No SQL errors in DevTools Console

---

## 🔧 Troubleshooting

### "Cannot find module 'supabase'"

→ Run: `npm install`

### App doesn't load (blank page)

→ Check .env.local exists with correct Supabase credentials

### PWA install button not appearing

→ Verify icons exist in `public/icons/` (3 PNG files)

### Printer services empty

→ Browser Print should always show - check console for errors

### Service Worker not registering

→ Run `npm run build && npm run preview` and check DevTools

---

## 📋 What to Report When Complete

- [ ] All tests passing
- [ ] Icons generated and visible
- [ ] .env.local created with credentials
- [ ] App builds with zero errors
- [ ] PWA installs successfully
- [ ] Printer services working

---

## Next Phase (Phase 6)

Once testing complete:

```bash
git add .
git commit -m "Phase 5 complete: Testing verified, ready for deployment"
git push

# Then deploy to Vercel or your hosting platform
```

See [PHASE_5_TESTING_GUIDE.md](PHASE_5_TESTING_GUIDE.md) for detailed step-by-step instructions.

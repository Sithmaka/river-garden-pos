# Deployment Instructions

## Before Deploying to Vercel

### Step 1: Update Production Domain

Edit `electron/config.cjs` and replace the placeholder domain:

```javascript
production: {
  appUrl: 'https://your-actual-domain.com', // ← Change this!
}
```

**Example:**

- If your domain is `codebell-pos.vercel.app`: use `https://codebell-pos.vercel.app`
- If your custom domain is `pos.yourdomain.com`: use `https://pos.yourdomain.com`

### Step 2: Deploy to Vercel

```bash
# Push to GitHub
git add .
git commit -m "Configure production URLs"
git push origin main

# Vercel will auto-deploy (if connected to GitHub)
# Or manually deploy:
vercel --prod
```

### Step 3: Test the Web App

Visit your deployed URL and verify:

- ✅ Login works
- ✅ Orders can be created
- ✅ Settings can be saved
- ✅ PWA installs on mobile

### Step 4: Build Electron Installer

```bash
# Create release tag
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions will automatically build installers for:

- Windows (`.exe`)
- macOS (`.dmg`)

Download from: `https://github.com/MHN-Sathsara/codebell_pos-PWA/releases`

### Step 5: Test Electron App

1. Download the installer from GitHub Releases
2. Install on a test computer
3. Verify it connects to your production domain
4. Test printing functionality
5. Verify auto-update notifications appear

## How It Works

### Development Mode

- Electron connects to: `http://localhost:5173` (Vite dev server)
- Auto-updates: **DISABLED**
- DevTools: **ENABLED**

### Production Mode

- Electron connects to: Your Vercel domain
- Auto-updates: **ENABLED** (checks hourly)
- DevTools: **DISABLED**

## Architecture

```
┌─────────────────────────────────────┐
│   Namecheap Domain                  │
│   ↓                                 │
│   Vercel Hosting                    │
│   → React PWA App                   │
│   → Supabase Database               │
└─────────────────┬───────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
   ┌────▼────┐         ┌────▼────┐
   │ Browser │         │ Electron│
   │ (PWA)   │         │ Desktop │
   └─────────┘         └────┬────┘
                            │
                    ┌───────┴────────┐
                    │ Local Printers │
                    │ (Silent Print) │
                    └────────────────┘
```

## Updating Your App

### For Web Users (PWA)

- Push code to GitHub → Auto-deploys to Vercel
- Users get updates automatically on next visit

### For Desktop Users (Electron)

1. Update code
2. Push to GitHub
3. Create new tag: `git tag v1.0.1 && git push origin v1.0.1`
4. GitHub Actions builds new installers
5. Existing users get notification: "Update available"
6. They click "Restart Now" → Updated!

## Troubleshooting

### Electron shows blank screen

- Check `electron/config.cjs` has correct production URL
- Verify Vercel deployment is successful
- Check browser console for CORS errors

### Auto-update not working

- Verify GitHub release exists
- Check `package.json` has correct repository URL
- Ensure version number increased (1.0.0 → 1.0.1)

### Printing not working

- Verify printer drivers installed
- Check Windows Firewall settings
- Test with "Browser Print Dialog" first

## Security Notes

1. **HTTPS Required**: Electron only connects via HTTPS in production
2. **CSP Headers**: Configure in Vercel for security
3. **API Keys**: Store in Vercel environment variables
4. **Auto-updates**: Only from GitHub (signed releases)

## Configuration Summary

- `electron/config.cjs` - URL configuration (dev/production)
- `electron/main.cjs` - Uses config for window loading
- Auto-updater only runs in production mode
- DevTools only open in development mode

## Next Steps

1. **Now**: Edit `electron/config.cjs` with your domain
2. **Deploy**: Push to Vercel
3. **Release**: Create v1.0.0 tag
4. **Distribute**: Share GitHub release link with clients

Your POS system is ready for production! 🚀

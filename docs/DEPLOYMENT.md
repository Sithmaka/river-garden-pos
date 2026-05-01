# BiteSync POS - Deployment Guide

## Prerequisites

- GitHub account
- Vercel account (sign up at vercel.com)
- Supabase project credentials (URL and anon key)

## Deployment Steps

### 1. Initialize Git Repository (if not already done)

```bash
git init
git add .
git commit -m "Initial commit - Epic 1 complete"
```

### 2. Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository named `codebell-pos` (or your preferred name)
3. **Do NOT** initialize with README, .gitignore, or license (we already have these)
4. Copy the repository URL

### 3. Push Code to GitHub

```bash
git remote add origin YOUR_GITHUB_REPO_URL
git branch -M main
git push -u origin main
```

### 4. Deploy to Vercel

#### Option A: Using Vercel CLI (Recommended)

1. Install Vercel CLI globally:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. Follow the prompts:
   - Link to existing project? **N**
   - Project name? **codebell-pos** (or your preferred name)
   - Which directory is your code located? **./  **
   - Want to modify settings? **N**

5. Set environment variables:
```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

6. Deploy to production:
```bash
vercel --prod
```

#### Option B: Using Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure project:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. Add Environment Variables:
   - Click "Environment Variables"
   - Add `VITE_SUPABASE_URL` with your Supabase project URL
   - Add `VITE_SUPABASE_ANON_KEY` with your Supabase anon key

5. Click "Deploy"

### 5. Verify Deployment

Once deployed, Vercel will provide you with a URL (e.g., `https://codebell-pos.vercel.app`)

Test the following:

1. **Login Page Loads**
   - Navigate to your deployment URL
   - Verify login page displays correctly

2. **Authentication Works**
   - Login as `admin@bitesync.test` with password `Admin123`
   - Verify redirect to `/admin/dashboard`
   - Verify Indigo theme applies correctly

3. **System Status Indicator**
   - Check dashboard shows "✓ System Status: Connected to Supabase"
   - If shows connection error, verify environment variables

4. **Role-Based Routing**
   - Logout
   - Login as `cashier@bitesync.test` with password `Cashier123`
   - Verify redirect to `/cashier/dashboard`
   - Verify Teal theme applies correctly

5. **Protected Routes**
   - Try accessing `/admin/dashboard` as cashier
   - Verify redirect to `/cashier/dashboard`

### 6. Setup CI/CD (Automatic Deployments)

Vercel automatically sets up CI/CD for you! Every push to your `main` branch will trigger a new deployment.

To test:
```bash
# Make a small change
echo "# BiteSync POS" > test.txt
git add test.txt
git commit -m "Test CI/CD"
git push origin main
```

Check the Vercel dashboard to see the automatic deployment in progress.

### 7. Custom Domain (Optional)

1. In Vercel dashboard, go to your project
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions
5. Vercel will automatically provision SSL certificate

## Environment Variables Required

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://xxxxxxxxxxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

## Troubleshooting

### Connection Error on Dashboard

**Problem**: Dashboard shows "System Status: Connection Error"

**Solution**:
1. Verify environment variables are set in Vercel dashboard
2. Check Supabase project is active and accessible
3. Verify RLS policies are correctly configured (Story 1.3)
4. Check browser console for detailed error messages

### 404 on Page Refresh

**Problem**: Refreshing any route (e.g., `/admin/dashboard`) shows 404

**Solution**: Verify `vercel.json` exists with correct rewrites configuration (already included in project)

### Build Fails

**Problem**: Vercel build process fails

**Solutions**:
1. Check build logs in Vercel dashboard
2. Verify `package.json` scripts are correct
3. Ensure all dependencies are in `package.json` (not just devDependencies)
4. Test build locally: `npm run build`

### Theme Not Applying

**Problem**: Dashboards show default styling instead of role-based themes

**Solution**:
1. Clear browser cache
2. Verify Tailwind configuration includes custom theme colors
3. Check ThemeContext is properly initialized

## Monitoring

- **Vercel Analytics**: Enable in project settings for visitor metrics
- **Error Tracking**: Check Vercel logs for runtime errors
- **Supabase Dashboard**: Monitor database queries and auth activity

## Next Steps

After successful deployment:

1. ✅ Mark Story 1.7 as complete
2. ✅ Epic 1 (Foundation & Infrastructure) is complete!
3. �� Ready to start Epic 2 (Admin Features) - Story 2.1

---

**Deployment Checklist:**

- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] Environment variables configured
- [ ] Production deployment successful
- [ ] Admin login tested
- [ ] Cashier login tested
- [ ] System status shows "Connected"
- [ ] Role-based routing works
- [ ] Themes apply correctly
- [ ] CI/CD verified (test push triggers deployment)

---

**Questions or Issues?**

- Check Vercel documentation: https://vercel.com/docs
- Review Supabase logs for database errors
- Verify environment variables are set correctly

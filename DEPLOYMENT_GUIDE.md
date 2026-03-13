# Deployment Guide - DivorceOS

This guide will walk you through deploying DivorceOS to GitHub and Vercel.

## Step 1: Create a GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the **+** icon in the top right → **New repository**
3. Name it `divorceos` (or your preferred name)
4. Choose **Public** or **Private**
5. Click **Create repository**

## Step 2: Push Code to GitHub

Open your terminal in the project folder and run:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - DivorceOS"

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/divorceos.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Vercel

### Option A: Vercel Dashboard (Easiest)

1. Go to [Vercel](https://vercel.com) and sign in
2. Click **Add New...** → **Project**
3. Import your GitHub repository
4. Vercel will auto-detect Vite settings:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Click **Deploy**

### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# For production deployment
vercel --prod
```

## Step 4: Configure Custom Domain (Optional)

1. In your Vercel dashboard, go to your project
2. Click **Settings** → **Domains**
3. Add your custom domain
4. Follow Vercel's DNS configuration instructions

## Project Files Overview

| File | Purpose |
|------|---------|
| `vercel.json` | Vercel deployment configuration |
| `vite.config.ts` | Vite build configuration |
| `package.json` | Dependencies and scripts |
| `tsconfig.json` | TypeScript configuration |
| `tailwind.config.js` | Tailwind CSS configuration |

## Environment Variables

If you need to add API keys or secrets:

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add your variables
4. Redeploy

## Updating Your Site

After making changes:

```bash
# Commit and push changes
git add .
git commit -m "Your update message"
git push

# Vercel will auto-deploy on push
```

## Troubleshooting

### Build Fails
- Check that `dist` folder is created after build
- Verify `vercel.json` has correct output directory
- Check build logs in Vercel dashboard

### Routing Issues
- The `vercel.json` rewrite rule handles client-side routing
- Make sure it's included in your repo

### Dependencies Missing
- Run `npm install` locally to verify
- Check `package.json` has all required dependencies

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Documentation](https://vitejs.dev/guide/)
- [React Router Documentation](https://reactrouter.com/)

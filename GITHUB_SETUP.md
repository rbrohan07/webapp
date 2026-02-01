# GitHub Setup Instructions

## Step 1: Create Repository on GitHub

1. Go to https://github.com/new
2. Enter repository name (e.g., `chatbot-interface`)
3. Choose Public or Private
4. **DO NOT** check "Initialize with README"
5. Click "Create repository"

## Step 2: Push Your Code

After creating the repository, run these commands:

```bash
# Add the remote (replace YOUR_USERNAME and YOUR_REPO_NAME)
git remote add origin https://github.com/rbrohan07/vite-react.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Alternative: If you already have a repository URL

If you already created the repository, just run:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

## What's Already Committed

✅ All source code files
✅ README.md
✅ Documentation
✅ Configuration files
✅ .gitignore (excludes node_modules, .env, etc.)

## What's NOT Committed (by design)

❌ node_modules/ (too large, install with npm install)
❌ .env (contains your API key - keep it secret!)
❌ dist/ (build output)
❌ __pycache__/ (Python cache)


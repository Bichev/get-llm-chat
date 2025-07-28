# 🚀 Production-Ready API Setup

## Quick Start (Real ChatGPT Parsing)

### Option 1: Start API Server Only
```bash
# In a new terminal (keep your current `npm run dev` running)
vercel dev --listen 3001
```

### Option 2: Start Both Servers
```bash
# Stop current dev server (Ctrl+C)
# Then run both frontend + API together:
npm run dev:full
```

## What This Enables

✅ **Real ChatGPT URL Parsing** - No more demo conversations  
✅ **CORS Bypass** - Server-side fetching works perfectly  
✅ **Production Ready** - Deploy instantly with `npm run deploy`  
✅ **Local Testing** - Full functionality on localhost  

## How It Works

1. **Frontend**: `http://localhost:5173` (Vite dev server)
2. **API**: `http://localhost:3001` (Vercel dev server)
3. **Magic**: API fetches ChatGPT → Frontend gets parsed data

## Test With Real URL

Once both servers are running:

1. Go to [ChatGPT](https://chatgpt.com)
2. Share any conversation (get a share URL)
3. Paste the URL in your app
4. **Export real conversations!** 🎉

## Deploy to Production

```bash
# Login to Vercel (first time only)
vercel login

# Deploy instantly
npm run deploy
```

Your app will be live at `https://your-app.vercel.app` with full ChatGPT parsing!

## Troubleshooting

**Error: "API server not available"**
- Make sure `vercel dev --listen 3001` is running on port 3001
- Check that both servers are running

**Error: "Failed to fetch"**  
- Try restarting the Vercel dev server
- Ensure no other apps are using port 3001 
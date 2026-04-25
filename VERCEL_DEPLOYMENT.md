# Vercel Deployment Guide - PulseTrader

## Overview
This project deploys both the Next.js web app and the Python signal engine on **Vercel only**.

- **Web App**: `web/` → Next.js on Vercel
- **Signal Engine**: `signal_engine/` → Python ASGI app with Cron on Vercel

## Architecture Change for Signal Engine

Previously, signal_engine used `APScheduler.BlockingScheduler` which runs indefinitely. Vercel doesn't support long-running processes (15-minute timeout limit).

**New approach:**
- Signal engine is now a **FastAPI app** (`api/cron.py`)
- **Vercel Cron** (`vercel.json`) calls `/api/cron` endpoint every 60 seconds
- Same pipeline logic runs, just triggered via HTTP instead of continuous scheduler

## Deployment Steps

### 1. Prerequisites
- Vercel CLI: `npm i -g vercel`
- GitHub repo with this code pushed

### 2. Deploy Web App (Next.js)
```bash
cd web
vercel deploy
```
- Select project type: **Next.js**
- Use defaults for most prompts
- Set environment variables in Vercel dashboard:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server-only)
  - `OPENAI_API_KEY`
  - `OPENAI_BASE_URL` (optional)
  - `OPENAI_MODEL` (optional)

### 3. Deploy Signal Engine (Python ASGI + Cron)
```bash
cd signal_engine
vercel deploy
```
- Select project type: **Other** (or it auto-detects Python)
- Vercel will detect `api/cron.py` as the ASGI app
- Cron will be configured from `vercel.json` automatically

### 4. Set Signal Engine Environment Variables
In Vercel dashboard for signal_engine project, set:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEWS_API_KEY`
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL` (optional)
- `OPENAI_MODEL` (optional)
- `MARKET_MODE` (optional, defaults to "global")

### 5. Verify Deployment

**Web app health check:**
```bash
curl https://your-pulsetrader-web.vercel.app
```

**Signal engine health check:**
```bash
curl https://your-pulsetrader-signal-engine.vercel.app
```

**Trigger signal pipeline manually:**
```bash
curl https://your-pulsetrader-signal-engine.vercel.app/api/cron
```

**View cron logs:**
- Go to Vercel dashboard → signal_engine project → Monitoring → Cron
- Check execution history and logs

## Local Development

### Run signal engine locally (with old scheduler for testing):
```bash
cd signal_engine
python main.py           # Continuous scheduler
python main.py --once    # Run once and exit
```

### Run signal engine ASGI app locally:
```bash
cd signal_engine
python -m uvicorn api.cron:app --reload --host 0.0.0.0 --port 8000
```
Then visit: `http://localhost:8000/api/cron`

## Cron Schedule

The cron is configured in `signal_engine/vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "* * * * *"  // Every minute
    }
  ]
}
```

To change frequency:
- `"0 * * * *"` → Every hour at minute 0
- `"0 0 * * *"` → Daily at midnight
- `"*/5 * * * *"` → Every 5 minutes
- `"* * * * *"` → Every minute (default)

See [cron syntax](https://crontab.guru/) for more patterns.

## Troubleshooting

### "No python entrypoint found"
- Ensure `pyproject.toml` exists with `[tool.poetry.scripts]` section
- Ensure `api/cron.py` exists and is valid Python
- Rebuild: `vercel deploy --prod`

### Cron not running
- Check Vercel dashboard → Monitoring → Cron for execution logs
- Manual test: `curl https://your-app.vercel.app/api/cron`
- Check if environment variables are set (cron may fail silently if they're missing)

### Pipeline returns 500 error
- Check logs in Vercel dashboard
- Ensure all environment variables are set
- Test importing locally: `python -c "from scheduler.jobs import run_signal_pipeline"`

### Still seeing BlockingScheduler error
- Delete `main.py` or mark it as deprecated (only for local testing)
- Ensure Vercel is deploying the `api/cron.py` version, not `main.py`

## Files Changed

- ✅ Created: `signal_engine/api/cron.py` (FastAPI endpoint)
- ✅ Created: `signal_engine/api/__init__.py`
- ✅ Created: `signal_engine/vercel.json` (cron config)
- ✅ Created: `signal_engine/pyproject.toml` (Python entry point)
- ✅ Updated: `signal_engine/requirements.txt` (added fastapi, uvicorn, gunicorn)
- ✅ Created: `vercel.json` (monorepo root config)
- ℹ️  Kept: `signal_engine/main.py` (still works locally with `python main.py`)

## Costs

- **Web app**: Free tier on Vercel (12 deployments/month, good for development)
- **Signal engine**: Free tier on Vercel, **BUT** Cron executions may incur costs after free plan
  - Check Vercel pricing for Cron function execution limits
  - Consider upgrading if running every 60 seconds = 1,440 calls/day

## Next Steps

1. Push changes to GitHub
2. Run `vercel deploy` from root directory (or each subdirectory)
3. Monitor logs in Vercel dashboard
4. Test the pipeline by checking Supabase for new signal data

Happy trading! 🚀

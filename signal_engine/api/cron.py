"""
Vercel Cron Handler: Runs signal pipeline on schedule.
This replaces the BlockingScheduler for Vercel deployment.
"""
import logging
from fastapi import FastAPI
from fastapi.responses import JSONResponse

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger("pulsetrader")

app = FastAPI(title="PulseTrader Signal Engine")


@app.get("/api/cron")
async def cron_signal_pipeline():
    """
    HTTP endpoint to run the signal pipeline.
    Called by Vercel Cron every 60 seconds.
    """
    try:
        from scheduler.jobs import run_signal_pipeline

        logger.info("🔔 Cron triggered: running signal pipeline")
        run_signal_pipeline()
        logger.info("✅ Pipeline completed successfully")

        return JSONResponse(
            status_code=200,
            content={"status": "success", "message": "Pipeline executed"}
        )
    except Exception as e:
        logger.error(f"❌ Pipeline failed: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)}
        )


@app.get("/")
async def health_check():
    """Health check endpoint for Vercel."""
    return {"status": "ok", "app": "pulsetrader-signal-engine"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

"""
PulseTrader Signal Engine — Entry Point

Usage:
  python main.py              # run scheduler (every 60s)
  python main.py --once       # run pipeline once and exit
"""
import sys
import logging
import argparse
from apscheduler.schedulers.blocking import BlockingScheduler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger("pulsetrader")


def main() -> None:
    parser = argparse.ArgumentParser(description="PulseTrader Signal Engine")
    parser.add_argument("--once", action="store_true", help="Run pipeline once and exit")
    args = parser.parse_args()

    # Import here so config/settings loads after dotenv
    from config import settings
    from scheduler.jobs import run_signal_pipeline

    if args.once:
        logger.info("Running pipeline once…")
        run_signal_pipeline()
        logger.info("Done.")
        sys.exit(0)

    logger.info(
        "Starting scheduler — interval %ds — tracking %d tickers",
        settings.SCHEDULE_INTERVAL_SECONDS,
        len(settings.TICKERS),
    )

    scheduler = BlockingScheduler(timezone="UTC")
    scheduler.add_job(
        run_signal_pipeline,
        "interval",
        seconds=settings.SCHEDULE_INTERVAL_SECONDS,
        id="signal_pipeline",
        max_instances=1,
    )

    # Run once immediately on start
    run_signal_pipeline()

    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Scheduler stopped.")


if __name__ == "__main__":
    main()

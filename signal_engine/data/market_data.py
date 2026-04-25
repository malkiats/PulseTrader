"""Fetch OHLCV market data using yfinance with retry logic and in-memory caching."""
import logging
import time
from typing import Optional
import pandas as pd
import yfinance as yf
from config import settings

logger = logging.getLogger(__name__)

# Simple in-memory TTL cache: {ticker: (timestamp, dataframe)}
_cache: dict[str, tuple[float, pd.DataFrame]] = {}
CACHE_TTL_SECONDS = 55  # slightly under 1-minute schedule interval


def fetch_ohlcv(ticker: str, retries: int = 3) -> Optional[pd.DataFrame]:
    """
    Returns a DataFrame with OHLCV columns plus the ticker for a given symbol.
    Uses yfinance with a short retry loop on failure.
    Returns None if all retries fail.
    """
    # Check cache
    now = time.time()
    if ticker in _cache:
        cached_at, cached_df = _cache[ticker]
        if now - cached_at < CACHE_TTL_SECONDS:
            logger.debug("Cache hit for %s", ticker)
            return cached_df

    for attempt in range(1, retries + 1):
        try:
            tf = yf.Ticker(ticker)
            df = tf.history(
                period=settings.MARKET_DATA_PERIOD,
                interval=settings.MARKET_DATA_INTERVAL,
                auto_adjust=True,
            )
            if df.empty:
                logger.warning("Empty dataframe for %s (attempt %d)", ticker, attempt)
                continue

            df = df.rename(columns=str.lower)
            df["ticker"] = ticker
            df = df.reset_index()
            _cache[ticker] = (now, df)
            logger.info("Fetched %d candles for %s", len(df), ticker)
            return df

        except Exception as exc:
            logger.error("Error fetching %s (attempt %d): %s", ticker, attempt, exc)
            if attempt < retries:
                time.sleep(2 ** attempt)  # exponential back-off

    return None


def fetch_all(tickers: list[str]) -> dict[str, pd.DataFrame]:
    """Fetch OHLCV for every ticker; skips failed ones."""
    results: dict[str, pd.DataFrame] = {}
    for ticker in tickers:
        df = fetch_ohlcv(ticker)
        if df is not None:
            results[ticker] = df
    return results

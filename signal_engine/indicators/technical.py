"""Compute technical indicators (RSI, MA50, MA200, MACD, Bollinger Bands)."""
import logging
from typing import Optional
import pandas as pd
import ta
from config import settings

logger = logging.getLogger(__name__)


def compute_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """
    Accepts an OHLCV DataFrame from market_data.py.
    Returns the DataFrame enriched with indicator columns.
    Requires a 'close' column.
    """
    if df.empty or "close" not in df.columns:
        logger.warning("Cannot compute indicators: empty or missing 'close' column.")
        return df

    close = df["close"]

    # RSI
    df["rsi"] = ta.momentum.RSIIndicator(close=close, window=settings.RSI_PERIOD).rsi()

    # Moving averages
    df["ma50"] = ta.trend.SMAIndicator(close=close, window=settings.MA_SHORT).sma_indicator()
    df["ma200"] = ta.trend.SMAIndicator(close=close, window=settings.MA_LONG).sma_indicator()

    # MACD
    macd_obj = ta.trend.MACD(close=close)
    df["macd"] = macd_obj.macd()
    df["macd_signal"] = macd_obj.macd_signal()
    df["macd_diff"] = macd_obj.macd_diff()

    # Bollinger Bands
    bb = ta.volatility.BollingerBands(close=close, window=20, window_dev=2)
    df["bb_upper"] = bb.bollinger_hband()
    df["bb_lower"] = bb.bollinger_lband()
    df["bb_mid"] = bb.bollinger_mavg()

    return df


def latest_indicators(df: pd.DataFrame) -> dict:
    """
    Returns the most recent row of indicators as a plain dict.
    Keys: price, rsi, ma50, ma200, macd, macd_signal, macd_diff,
          bb_upper, bb_lower, bb_mid
    """
    if df.empty:
        return {}

    row = df.iloc[-1]

    def safe(col: str) -> Optional[float]:
        val = row.get(col)
        if val is None:
            return None
        try:
            f = float(val)
            return None if pd.isna(f) else round(f, 4)
        except (TypeError, ValueError):
            return None

    return {
        "price":       safe("close"),
        "rsi":         safe("rsi"),
        "ma50":        safe("ma50"),
        "ma200":       safe("ma200"),
        "macd":        safe("macd"),
        "macd_signal": safe("macd_signal"),
        "macd_diff":   safe("macd_diff"),
        "bb_upper":    safe("bb_upper"),
        "bb_lower":    safe("bb_lower"),
        "bb_mid":      safe("bb_mid"),
    }

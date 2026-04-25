"""Central configuration for the PulseTrader signal engine."""
import os
from dotenv import load_dotenv

load_dotenv()

# ── Supabase ─────────────────────────────────────────────────
SUPABASE_URL: str = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY: str = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

# ── Market Mode ──────────────────────────────────────────────
# Can be 'global' or 'indian'
MARKET_MODE: str = os.getenv("MARKET_MODE", "global").lower()

# ── News ─────────────────────────────────────────────────────
NEWS_API_KEY: str = os.getenv("NEWS_API_KEY", "")

GLOBAL_RSS_FEEDS: list[str] = [
    "https://feeds.finance.yahoo.com/rss/2.0/headline?s={ticker}&region=US&lang=en-US",
    "https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best",
]

INDIAN_RSS_FEEDS: list[str] = [
    "https://www.zeebiz.com/feeds/latest.xml",
    "https://feeds.moneycontrol.com/mcsite/latest_news.xml",
    "https://economictimes.indiatimes.com/feed",
]

# ── Tickers to track ─────────────────────────────────────────
GLOBAL_TICKERS: list[str] = [
    "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA",
    "META", "TSLA", "NFLX", "AMD", "INTC",
]

INDIAN_TICKERS: list[str] = [
    "TCS.NS", "RELIANCE.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS",
    "WIPRO.NS", "HINDUNILVR.NS", "MARUTI.NS", "LT.NS", "ASIANPAINT.NS",
]

# Dynamic ticker selection based on market mode
TICKERS: list[str] = INDIAN_TICKERS if MARKET_MODE == "indian" else GLOBAL_TICKERS
RSS_FEEDS: list[str] = INDIAN_RSS_FEEDS if MARKET_MODE == "indian" else GLOBAL_RSS_FEEDS

# ── Market data ──────────────────────────────────────────────
MARKET_DATA_INTERVAL: str = "1m"   # yfinance interval
MARKET_DATA_PERIOD: str = "5d"     # enough history for MA200 warmup

# ── Technical indicators ─────────────────────────────────────
RSI_PERIOD: int = 14
MA_SHORT: int = 50
MA_LONG: int = 200

# ── Signal thresholds ────────────────────────────────────────
RSI_OVERSOLD: float = 30.0
RSI_OVERBOUGHT: float = 70.0

# Multi-factor weights (must sum to 1.0)
WEIGHT_TECHNICAL: float = 0.40
WEIGHT_SENTIMENT: float = 0.30
WEIGHT_EVENT: float = 0.20
WEIGHT_FUNDAMENTAL: float = 0.10

BUY_THRESHOLD: float = 0.5
SELL_THRESHOLD: float = -0.5

# ── Scheduler ────────────────────────────────────────────────
SCHEDULE_INTERVAL_SECONDS: int = 60
NEWS_FETCH_INTERVAL_SECONDS: int = 300   # news every 5 min

# ── Sentiment model ──────────────────────────────────────────
USE_FINBERT: bool = False   # set True if GPU/large machine; False uses VADER
FINBERT_MODEL: str = "ProsusAI/finbert"

# ── News items per ticker ────────────────────────────────────
NEWS_ITEMS_PER_TICKER: int = 10

# 🏗️ System Architecture — PulseTrader (AI Stock Trading Signal System)

## Overview

The system is composed of five core layers that work in a pipeline:

```
Stock Data API  →  Technical Engine  →  Signal Engine  →  Output Layer
                                ↑
News APIs  →  Sentiment Engine  ┘
```

---

## 📦 Module Breakdown

### 1. `data/market_data.py` — Market Data Fetcher
**Responsibility:** Fetch OHLCV (Open, High, Low, Close, Volume) data for all tracked stocks.

- Source: `yfinance` (upgradeable to Alpaca / Polygon)
- Interval: 1-minute candles
- Output: `pd.DataFrame` per ticker
- Features:
  - Retry logic on API failure
  - Basic in-memory caching to avoid redundant fetches

---

### 2. `data/news_fetcher.py` — News Aggregator
**Responsibility:** Collect the latest 5–10 headlines per stock from multiple sources.

- Sources:
  - NewsAPI (primary)
  - RSS feeds: Reuters, Bloomberg, Yahoo Finance, etc.
- Output: `list[dict]` with `title`, `source`, `published_at`, `url`
- Features:
  - Deduplication by URL hash
  - TTL-based caching (avoid reprocessing same articles)
  - Configurable source list in `config/settings.py`

---

### 3. `sentiment/analyzer.py` — Sentiment Engine
**Responsibility:** Score each headline using NLP sentiment analysis.

- Model: FinBERT (HuggingFace Transformers) — finance-specific
- Fallback: VADER (lightweight, rule-based)
- Output per headline: `{ "label": "positive|negative|neutral", "score": float }`
- Aggregation: average sentiment score per ticker across all headlines
- Features:
  - Batch inference for performance
  - Model loaded once at startup (singleton pattern)

---

### 4. `indicators/technical.py` — Technical Engine
**Responsibility:** Compute technical indicators from market data.

| Indicator | Parameters | Signal Use |
|-----------|-----------|------------|
| RSI       | Period: 14 | Oversold < 30, Overbought > 70 |
| MA (Short)| Period: 50 | Trend direction |
| MA (Long) | Period: 200 | Trend direction |
| MACD      | 12/26/9    | Optional (v2) |
| Bollinger Bands | 20, 2σ | Optional (v2) |

- Library: `ta` (technical analysis)
- Output: enriched `pd.DataFrame` with indicator columns

---

### 5. `strategy/signal_engine.py` — Signal Generator
**Responsibility:** Combine technical indicators + sentiment into a final signal.

#### Signal Logic (v1)

```
BUY  if:  RSI < 30  AND  MA50 > MA200  AND  sentiment > 0
SELL if:  RSI > 70  AND  MA50 < MA200  AND  sentiment < 0
HOLD otherwise
```

- Output per ticker:
```python
{
  "ticker": "AAPL",
  "price": 189.23,
  "rsi": 28.5,
  "ma50": 185.10,
  "ma200": 179.40,
  "sentiment": 0.67,
  "signal": "BUY",
  "timestamp": "2026-04-24T10:01:00Z"
}
```

---

### 6. `scheduler/jobs.py` — Pipeline Scheduler
**Responsibility:** Orchestrate the full pipeline on a recurring schedule.

- Library: `APScheduler`
- Default interval: every 60 seconds
- Job steps:
  1. Fetch market data for all tickers
  2. Fetch news headlines
  3. Run sentiment analysis
  4. Compute technical indicators
  5. Generate signals
  6. Write output (console + JSON)

---

### 7. `config/settings.py` — Configuration
**Responsibility:** Centralized configuration management.

```python
TICKERS = ["AAPL", "MSFT", "GOOGL", ...]  # 5 to 40 stocks
NEWS_SOURCES = ["newsapi", "rss_reuters", ...]
NEWS_API_KEY = os.getenv("NEWS_API_KEY")
SCHEDULE_INTERVAL_SECONDS = 60
RSI_PERIOD = 14
MA_SHORT = 50
MA_LONG = 200
OUTPUT_JSON_PATH = "output/signals.json"
```

---

### 8. `main.py` — Entry Point
**Responsibility:** Bootstrap the application.

- Load config
- Initialize models (FinBERT loaded once)
- Register scheduled jobs
- Start scheduler loop

---

## 🔄 Data Flow Diagram

```
┌──────────────────────────────────────────────────────┐
│                   Scheduler (60s)                    │
└──────────────────────┬───────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
┌─────────────────┐       ┌─────────────────────┐
│  market_data.py │       │   news_fetcher.py   │
│  (yfinance)     │       │  (NewsAPI + RSS)    │
└────────┬────────┘       └──────────┬──────────┘
         │                           │
         ▼                           ▼
┌─────────────────┐       ┌─────────────────────┐
│  technical.py   │       │   analyzer.py       │
│  (RSI, MA, ...) │       │   (FinBERT / VADER) │
└────────┬────────┘       └──────────┬──────────┘
         │                           │
         └─────────────┬─────────────┘
                       ▼
              ┌─────────────────┐
              │ signal_engine.py│
              │ BUY/SELL/HOLD   │
              └────────┬────────┘
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
   Console Output           signals.json
```

---

## 📐 Design Principles

| Principle | Applied As |
|-----------|-----------|
| **Separation of Concerns** | Each module owns exactly one responsibility |
| **Single Responsibility** | Functions do one thing, classes own one domain |
| **Extensibility** | New indicators / models plug in without touching signal logic |
| **Resilience** | Retry logic + graceful degradation on API failures |
| **Performance** | Caching news + batch NLP inference |

---

## 🛣️ Roadmap

| Phase | Scope |
|-------|-------|
| v1 | 5 stocks, 2 news sources, RSI + MA, FinBERT |
| v2 | 40 stocks, 10+ news sources, MACD, Bollinger |
| v3 | ML prediction layer (LSTM / XGBoost) |
| v4 | Streamlit real-time dashboard |
| v5 | Broker API integration (paper trading) |

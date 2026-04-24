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

---

# 🧠 Advanced v2 — Context-Aware Intelligence

This section extends the base architecture into a **context-aware, multi-factor trading intelligence platform**.

---

## 🆕 New Capabilities

### 1. Company-Specific News Filtering

Filter news by relevance signals per ticker:
- Company name (e.g., Apple)
- CEO name (e.g., Tim Cook)
- Products (e.g., iPhone)
- Industry keywords

Example queries: `"Apple earnings"`, `"Apple revenue growth"`, `"Apple iPhone demand"`

---

### 2. News Classification

| Category | Example | Impact Weight |
|----------|---------|---------------|
| Earnings | "Revenue beats expectations" | 1.0 |
| Regulation | "Government bans product" | 0.9 |
| Event | "Company acquires startup" | 0.8 |
| Product | "New product launch" | 0.6 |
| Macro | "Interest rate hike" | 0.6 |
| Opinion | "Analyst predicts growth" | 0.3 |

Module: `data/news_classifier.py`

---

### 3. Weighted Sentiment Scoring

```python
impact_score = sentiment_score * news_weight * relevance
```

| Component | Range | Notes |
|-----------|-------|-------|
| `sentiment_score` | -1.0 to +1.0 | FinBERT output |
| `news_weight` | 0.3 to 1.0 | Based on news category |
| `relevance` | 0.5 or 1.0 | Direct vs. indirect mention |

---

### 4. Event Detection Engine

Module: `data/event_detector.py`

```python
def detect_event(text: str) -> str:
    keywords = {
        "earnings":    ["earnings", "revenue", "profit"],
        "acquisition": ["acquire", "merger"],
        "leadership":  ["CEO", "resign", "appointed"],
        "legal":       ["lawsuit", "sued"],
    }
    for event, words in keywords.items():
        if any(word in text.lower() for word in words):
            return event
    return "general"
```

Detects: earnings beat/miss, M&A, CEO changes, lawsuits, product bans, partnerships.

---

### 5. Company Fundamentals Layer

Module: `data/fundamentals.py`

Metrics fetched per ticker:
- Revenue growth
- Earnings trend
- Debt ratio
- Profit margins
- Analyst ratings

---

### 6. Multi-Factor Signal Engine

```python
final_score = (
    technical_score    * 0.4 +
    sentiment_score    * 0.3 +
    event_score        * 0.2 +
    fundamental_score  * 0.1
)

if final_score > 0.5:
    signal = "BUY"
elif final_score < -0.5:
    signal = "SELL"
else:
    signal = "HOLD"
```

---

## 🏗️ Updated Architecture (v2)

```
Stock Data           ──────┐
Technical Indicators ──────┤
News Sentiment       ──────┼──▶  Multi-Factor Signal Engine  ──▶  BUY/SELL/HOLD
Event Detection      ──────┤
Company Fundamentals ──────┘
```

---

## 📂 New / Updated Modules (v2)

```
├── data/
│   ├── market_data.py         # (existing)
│   ├── news_fetcher.py        # (existing)
│   ├── news_classifier.py     # NEW — classifies news by type & weight
│   ├── event_detector.py      # NEW — detects market-moving events
│   ├── fundamentals.py        # NEW — company financial health
│
├── indicators/
│   ├── technical.py           # (existing)
│
├── sentiment/
│   ├── analyzer.py            # (existing, now feeds weighted scorer)
│
├── strategy/
│   ├── signal_engine.py       # UPDATED — multi-factor scoring
```

---

## ⚙️ v2 Data Flow

```
1. Fetch stock data (1-min interval)
2. Fetch latest 5–10 news articles per stock
3. Run sentiment analysis (FinBERT)
4. Classify news type → assign weight
5. Detect events → assign event_score
6. Calculate weighted sentiment score
7. Fetch fundamentals → fundamental_score
8. Combine all signals → final_score
9. Generate BUY / SELL / HOLD
10. Output to console + JSON
```

---

## 🧪 Future Enhancements (v3+)

- FinBERT fine-tuning on financial event corpus
- Named Entity Recognition (NER) for better company mention detection
- Sector-level macro analysis
- Portfolio optimization
- Risk management engine (stop-loss, position sizing)
- Real-time Streamlit dashboard
- ML layer (LSTM / XGBoost) for price movement prediction

---

## ⚠️ Important Considerations

- Not all news impacts stock price equally
- Timing and latency matter — stale news = wrong signal
- More data sources ≠ better signal; deduplication and weighting are critical
- Requires continuous tuning of weights per market regime

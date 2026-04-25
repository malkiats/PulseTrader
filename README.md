# 📈 PulseTrader - AI Stock Trading Signal System

An advanced Python-based system that analyzes:
- Real-time stock market data (1-minute interval)
- Multi-source financial news (10–20 sources)
- Sentiment analysis (NLP)
- Technical indicators (RSI, Moving Averages)

➡️ Outputs: **BUY / SELL / HOLD signals**

---

## 🚀 Features

- 🌍 **Global Mode**: US stocks (AAPL, MSFT, GOOGL, etc.)
- 🇮🇳 **Indian Mode**: Indian stocks (TCS, RELIANCE, INFY, etc.)
- 🤖 **AI Best Buy Recommendations**: Daily top 3 stocks to buy with confidence scores
- 📊 **Market Mode Toggle**: Switch between global and Indian markets instantly

---

## 🧠 System Architecture

```
            +------------------+
            |  Stock Data API  |
            +--------+---------+
                     |
                     v
            +------------------+
            | Technical Engine |
            | (RSI, MA, etc.)  |
            +--------+---------+
                     |
                     v

+-------------+     +------------------+     +------------------+
| News APIs   |---> | Sentiment Engine |---> | Signal Engine    |
| (10-20 src) |     | (NLP Models)     |     | BUY/SELL/HOLD    |
+-------------+     +------------------+     +--------+---------+
                                                      |
                                                      v
                                             +----------------+
                                             | Output Layer   |
                                             | CLI / Dashboard|
                                             +----------------+
```

---

## 🧩 Tech Stack

### Core
- Python 3.10+
- Pandas, NumPy

### Market Data
- `yfinance` (initial)
- Upgrade later: Alpaca / Polygon

### News Sources
- NewsAPI
- RSS feeds (Reuters, Bloomberg, etc.)

### NLP / Sentiment
- HuggingFace Transformers
- FinBERT (recommended for finance)

### Indicators
- `ta` (technical analysis library)

### Scheduling
- APScheduler / Celery

---

## 📊 Indicators Used

- RSI (Relative Strength Index)
- Moving Average (MA50, MA200)
- Optional: MACD, Bollinger Bands

---

## 🧠 Signal Logic (v1)

### BUY
- RSI < 30 (oversold)
- Short MA > Long MA
- Positive sentiment score

### SELL
- RSI > 70 (overbought)
- Short MA < Long MA
- Negative sentiment score

### HOLD
- Otherwise

---

## 📂 Project Structure

```
ai-trader/
│
├── data/
│   ├── market_data.py
│   ├── news_fetcher.py
│
├── indicators/
│   ├── technical.py
│
├── sentiment/
│   ├── analyzer.py
│
├── strategy/
│   ├── signal_engine.py
│
├── scheduler/
│   ├── jobs.py
│
├── config/
│   ├── settings.py
│
├── main.py
└── requirements.txt
```

---

## ⚙️ Setup

```bash
git clone <repo>
cd ai-trader
pip install -r requirements.txt
```

### 🔑 Environment Variables

```env
NEWS_API_KEY=your_key
```

### ▶️ Run

```bash
python main.py
```

---

## 📌 Future Improvements

- Add ML prediction models
- Portfolio optimization
- Risk management (stop-loss, position sizing)
- Real-time dashboard (Streamlit)
- Broker integration (paper trading first)

---

## ⚠️ Disclaimer

This system is for **educational purposes only**.
It does **NOT** guarantee profits.
Always validate strategies with backtesting before live trading.

---

## 🧠 Advanced v2 — Context-Aware Intelligence

> *Instead of relying only on price and basic sentiment, v2 integrates company-specific news understanding, event detection, business performance signals, and weighted decision scoring.*

### What's New in v2

| Capability | Description |
|------------|-------------|
| **Company-Specific Filtering** | News filtered by company name, CEO, products, industry keywords |
| **News Classification** | Categorizes news by impact: Earnings, Regulation, Event, Product, Macro, Opinion |
| **Weighted Sentiment Scoring** | `impact_score = sentiment_score × news_weight × relevance` |
| **Event Detection Engine** | Detects earnings beats, M&A, CEO changes, lawsuits, product bans |
| **Fundamentals Layer** | Revenue growth, earnings trend, debt ratio, analyst ratings |
| **Multi-Factor Signal Engine** | Combines all signals into a single weighted final score |

### Multi-Factor Score Formula

```python
final_score = (
    technical_score    * 0.4 +
    sentiment_score    * 0.3 +
    event_score        * 0.2 +
    fundamental_score  * 0.1
)
```

### Decision Logic

```python
if final_score > 0.5:
    signal = "BUY"
elif final_score < -0.5:
    signal = "SELL"
else:
    signal = "HOLD"
```

### New Modules (v2)

```
├── data/
│   ├── news_classifier.py     # Classifies news by type & impact weight
│   ├── event_detector.py      # Detects market-moving events
│   ├── fundamentals.py        # Fetches company financial health data
```

### Development Phases

| Phase | Scope |
|-------|-------|
| 1 | Technical indicators only |
| 2 | Add sentiment analysis |
| **3 (v2)** | **News classification + event detection** |
| 4 | Fundamentals integration |
| 5 | Machine learning optimization |

---

## ⚠️ Disclaimer (v2)

This system is for **educational and research purposes only**.
It does **not** guarantee profits or financial success.
Always validate with backtesting and paper trading before real-world usage.

# 📈 PulseTrader - AI Stock Trading Signal System

An advanced Python-based system that analyzes:
- Real-time stock market data (1-minute interval)
- Multi-source financial news (10–20 sources)
- Sentiment analysis (NLP)
- Technical indicators (RSI, Moving Averages)

➡️ Outputs: **BUY / SELL / HOLD signals**

---

## 🚀 Features

- Track 20–40 stocks simultaneously
- Fetch market data every minute
- Aggregate latest 5–10 news headlines per stock
- Perform sentiment analysis using NLP models
- Combine sentiment + technical indicators
- Generate actionable signals
- Modular & scalable architecture

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

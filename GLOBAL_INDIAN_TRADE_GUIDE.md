# Global vs Indian Trade Mode - Feature Guide

## Overview

PulseTrader now supports **TWO trading modes**:
- 🌍 **Global Mode**: US stocks (AAPL, MSFT, GOOGL, etc.)
- 🇮🇳 **Indian Mode**: Indian stocks (TCS, RELIANCE, INFY, etc.)

Users can **switch between modes** with a single click on the dashboard.

---

## Features

### 1. **Market Mode Toggle**
- **Location**: Top-right of dashboard
- **Options**: Global | India
- **Behavior**: Switching modes reloads page and fetches relevant stocks

### 2. **Smart Stock Selection**

#### Global Mode (Default)
Tracks leading US tech and mega-cap stocks:
```
AAPL, MSFT, GOOGL, AMZN, NVDA, META, TSLA, NFLX, AMD, INTC
```

#### Indian Mode
Tracks leading Indian NSE stocks:
```
TCS, RELIANCE, INFY, HDFC, ICICIBANK, WIPRO, HINDUNILVR, MARUTI, LT, ASIANPAINT
```

### 3. **News Source Switching**

#### Global Mode News
- Yahoo Finance RSS feeds (US-focused)
- Reuters Business feeds

#### Indian Mode News
- 📰 **Zee Business** (zeebiz.com)
- 📊 **Moneycontrol** (moneycontrol.com)
- 📈 **Economic Times** (economictimes.indiatimes.com)

### 4. **Best Buy Recommendations**

#### What It Does
Analyzes ALL current signals in real-time and recommends the **TOP 2-3 stocks to buy TODAY** with:
- ✅ Why it's a good buy (technical + sentiment analysis)
- 📈 Entry price range
- 🎯 Target prices (today & this week)
- ⚠️ Risk factors
- 💪 Confidence score (1-10)

#### How It Works
```
1. Fetches top 15 signals by score (latest for each stock)
2. Sends to OpenAI with comprehensive market context
3. AI provides ranked recommendations with reasoning
4. Displays top 3 with actionable insights
```

#### Features
- 🔄 **Auto-refresh**: Updates when you switch market modes
- 🔄 **Manual refresh**: Click "Refresh" button anytime
- 📊 **Token tracking**: See API costs at bottom
- ⚡ **Cost-optimized**: Uses gpt-4o-mini (~$0.01-0.05 per call)

---

## How to Use

### Switch Market Mode

```
1. Go to Dashboard: http://localhost:3000/dashboard
2. Look for toggle in top-right: "Global | India"
3. Click "India" to switch to Indian stocks
4. Page reloads with Indian stocks signals
5. Click "Global" to go back
```

### Get Best Buy Recommendation

```
1. Dashboard auto-loads best buy card
2. See top 3 recommended stocks with details
3. Read "Key Insights" - why each stock is good
4. Check "Target Price" - entry and exit points
5. Review "Risk Factors" - what could go wrong
6. Click "Refresh" for updated analysis anytime
```

### Example Output

```
🌟 BEST BUY TODAY

#1: TCS (Confidence: 9/10)
Entry: $3,450 - $3,500
Target Today: $3,580
Target Week: $3,650

Why: RSI oversold (28) + strong news sentiment
Technical: 50/200 MA bullish crossover
Risks: Sector rotation risk, market volatility

Market Outlook: Strong opening expected
Best Time: First 30 minutes of market open
Top Pick: If you can only buy ONE, pick TCS
```

---

## Technical Details

### Backend Configuration

**File**: `signal_engine/config/settings.py`
```python
# Market mode: 'global' or 'indian'
MARKET_MODE = os.getenv("MARKET_MODE", "global")

# Separate ticker lists
GLOBAL_TICKERS = ["AAPL", "MSFT", "GOOGL", ...]
INDIAN_TICKERS = ["TCS.NS", "RELIANCE.NS", ...]

# Dynamic selection based on mode
TICKERS = INDIAN_TICKERS if MARKET_MODE == "indian" else GLOBAL_TICKERS
```

**Environment Variable**:
```bash
# In signal_engine/.env
MARKET_MODE=global  # or 'indian'
```

### API Endpoints

#### 1. **Best Buy Recommendations**
```http
GET /api/best-buy?mode=global
GET /api/best-buy?mode=indian
```

**Response**:
```json
{
  "status": "success",
  "market_mode": "global",
  "analysis": {
    "top_recommendations": [
      {
        "ticker": "AAPL",
        "rank": 1,
        "buy_reason": "RSI oversold + strong earnings outlook",
        "confidence": 9,
        "entry_price": 189.50,
        "target_price_today": 192.00,
        "target_price_week": 195.00,
        "risk_factors": ["market volatility", "macro headwinds"]
      }
    ],
    "market_outlook": "Bullish open expected",
    "best_time_to_buy": "Market open (9:30 AM EST)",
    "portfolio_suggestion": "If picking one: AAPL"
  }
}
```

#### 2. **Individual Stock Analysis**
```http
POST /api/analyze
{ "ticker": "AAPL" }
```

---

## Cost Tracking

### Best Buy Recommendation Costs
- **Model**: gpt-4o-mini
- **Average tokens**: 2,000-2,500 tokens/call
- **Cost**: ~$0.015-0.025 per call
- **Frequency**: On-demand (user clicks refresh)

### Individual Analysis Costs
- **Model**: gpt-4o-mini
- **Average tokens**: 1,000-1,200 tokens/call
- **Cost**: ~$0.010-0.015 per call
- **Frequency**: On-demand (user clicks analyze)

**Total daily cost** (10 users, 5 analyses each):
```
50 analyses × $0.015 = $0.75/day
Cost-effective for production use!
```

---

## File Structure

```
PulseTrader/
├── signal_engine/
│   ├── config/settings.py (MARKET_MODE config)
│   ├── ai/
│   │   ├── analyzer.py (individual stock analysis)
│   │   └── best_buy.py (best buy recommendations)
│   └── data/
│       ├── news_fetcher.py (NewsAPI + RSS)
│       └── market_data.py (yfinance)
│
├── web/
│   ├── app/api/
│   │   ├── analyze/route.ts (individual analysis)
│   │   └── best-buy/route.ts (best buy API)
│   ├── components/dashboard/
│   │   ├── MarketModeToggle.tsx (toggle switch)
│   │   ├── BestBuyCard.tsx (recommendation card)
│   │   ├── DashboardHeader.tsx (header component)
│   │   └── AIAnalysisPanel.tsx (analysis modal)
│   └── app/(dashboard)/
│       └── dashboard/page.tsx (main dashboard)
```

---

## Future Enhancements

1. **Save Recommendations**: Store best buy history in Supabase
2. **Alerts**: Email/SMS when recommendation changes
3. **Portfolio Tracking**: Track which recommendations you acted on
4. **ML Accuracy**: Train model on recommendation success rate
5. **More Markets**: Add Singapore, Japan, UK stocks
6. **Live Sentiment**: Real-time Twitter/Reddit sentiment for stocks
7. **Earnings Calendar**: Auto-recommend stocks near earnings

---

## Troubleshooting

### Issue: "Best Buy Card Not Loading"
**Solution**: 
- Ensure signal data exists (run signal engine)
- Check OPENAI_API_KEY in .env
- Verify API bearer token is valid

### Issue: "Wrong Market Stocks Showing"
**Solution**:
- Clear browser localStorage: `localStorage.clear()`
- Toggle market mode again
- Restart dev server

### Issue: "Indian RSS Feeds Not Working"
**Solution**:
- Feeds are fallback; main data from NewsAPI
- Check NEWS_API_KEY is valid
- Indian news takes 5-10 seconds to fetch (rate limited)

### Issue: "AI Recommendation Slow"
**Solution**:
- First call takes 3-5 seconds (normal)
- Subsequent calls are cached for 60 seconds
- Check internet connection
- OpenAI quota may be exhausted

---

## Quick Start

```bash
# 1. Set market mode to global (default)
export MARKET_MODE=global

# 2. Start signal engine (global stocks)
cd signal_engine
.venv/bin/python main.py --once

# 3. Start web app
cd ../web
npm run dev

# 4. Open dashboard
# http://localhost:3000/dashboard

# 5. See best buy recommendation card
# 6. Click "India" toggle to switch to Indian stocks
# 7. Signal engine will automatically fetch Indian stocks next run

# Switch to Indian mode:
export MARKET_MODE=indian
.venv/bin/python main.py --once
```

---

## Key Statistics

| Metric | Global | Indian |
|--------|--------|--------|
| Stocks Tracked | 10 | 10 |
| News Sources | 2 | 3 |
| Market Hours | 9:30-16:00 EST | 9:15-15:30 IST |
| Currency | USD | INR |
| Market Cap Range | Mega-cap tech | Large-cap blue-chip |
| Recommendation Cost | ~$0.015 | ~$0.015 |

---

## Support & Feedback

For questions or bugs:
1. Check error messages on dashboard
2. Review logs: `web/.next/logs/build.log`
3. Check signal engine logs: `signal_engine/main.py` output
4. Verify API keys and credentials in `.env` files

Enjoy analyzing stocks! 📊✨

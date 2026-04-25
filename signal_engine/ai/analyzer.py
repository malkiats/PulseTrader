"""
AI-powered trading analysis using OpenAI.
Provides intelligent recommendations based on comprehensive market data.
"""

import os
import json
from typing import Optional, Dict, Any
from openai import OpenAI

# Initialize OpenAI client
client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url=os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
)

MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")


def analyze_stock(
    ticker: str,
    current_price: float,
    technical_signal: Dict[str, Any],
    sentiment_score: float,
    recent_news: list,
    market_data: Dict[str, Any],
    historical_signals: Optional[list] = None
) -> Dict[str, Any]:
    """
    Analyze stock using OpenAI to provide intelligent trading recommendations.
    
    Args:
        ticker: Stock ticker symbol (e.g., 'AAPL')
        current_price: Current stock price
        technical_signal: Dict with RSI, MA50, MA200, MACD, etc.
        sentiment_score: Aggregated sentiment from news (-1 to +1)
        recent_news: List of recent news items with titles and sentiment
        market_data: OHLCV market data
        historical_signals: Previous signals for trend analysis
        
    Returns:
        Dict with analysis, recommendation (BUY/SELL/HOLD), confidence, and rationale
    """
    
    try:
        # Format recent news for the prompt
        news_summary = "\n".join([
            f"  • {item.get('title', 'N/A')} (Sentiment: {item.get('sentiment', 'neutral')})"
            for item in recent_news[:5]  # Last 5 news items
        ])
        
        if not news_summary.strip():
            news_summary = "  • No recent news available"
        
        # Format technical indicators
        rsi = technical_signal.get("rsi", 50)
        ma50 = technical_signal.get("ma50", current_price)
        ma200 = technical_signal.get("ma200", current_price)
        macd = technical_signal.get("macd", {})
        
        # Determine trend
        trend = "uptrend" if ma50 > ma200 else "downtrend" if ma50 < ma200 else "sideways"
        rsi_status = "overbought" if rsi > 70 else "oversold" if rsi < 30 else "neutral"
        
        # Construct detailed analysis prompt
        prompt = f"""You are an expert financial analyst and trading advisor. Analyze the following stock and provide a trading recommendation.

STOCK: {ticker}
Current Price: ${current_price:.2f}

TECHNICAL ANALYSIS:
- RSI (14): {rsi:.2f} [{rsi_status}]
- MA50: ${ma50:.2f}
- MA200: ${ma200:.2f}
- Price Trend: {trend.upper()}
- MACD Signal: {macd.get('signal', 'N/A')}

MARKET SENTIMENT:
- Overall Sentiment Score: {sentiment_score:.2f} (range: -1 to +1, where 1 is most bullish)

RECENT NEWS & EVENTS:
{news_summary}

MARKET DATA:
- 52-Week High: ${market_data.get('high_52w', 'N/A')}
- 52-Week Low: ${market_data.get('low_52w', 'N/A')}
- Volume: {market_data.get('volume', 'N/A')}
- Market Cap: {market_data.get('market_cap', 'N/A')}

Based on this comprehensive analysis, provide:

1. **Recommendation**: BUY, SELL, or HOLD
2. **Confidence Level**: 1-10 (where 10 is most confident)
3. **Key Insights**: 2-3 bullet points explaining your analysis
4. **Price Target**: Expected price in 1-3 months (estimate range)
5. **Risk Level**: LOW, MEDIUM, or HIGH
6. **Action Items**: Specific entry/exit points or conditions to watch

Format your response as JSON with these exact keys:
{{
    "recommendation": "BUY|SELL|HOLD",
    "confidence": <1-10>,
    "key_insights": ["insight1", "insight2", "insight3"],
    "price_target_low": <float>,
    "price_target_high": <float>,
    "risk_level": "LOW|MEDIUM|HIGH",
    "action_items": ["action1", "action2"],
    "rationale": "detailed explanation"
}}

Analyze carefully and provide professional, actionable insights for a trading decision."""

        # Call OpenAI API
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert financial analyst providing professional trading recommendations. Always respond with valid JSON."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=1000,
            response_format={"type": "json_object"}
        )
        
        # Parse response
        analysis_text = response.choices[0].message.content
        analysis = json.loads(analysis_text)
        
        # Ensure all required fields exist
        analysis.setdefault("recommendation", "HOLD")
        analysis.setdefault("confidence", 5)
        analysis.setdefault("key_insights", [])
        analysis.setdefault("price_target_low", current_price * 0.95)
        analysis.setdefault("price_target_high", current_price * 1.05)
        analysis.setdefault("risk_level", "MEDIUM")
        analysis.setdefault("action_items", [])
        analysis.setdefault("rationale", "Analysis complete")
        
        return {
            "status": "success",
            "ticker": ticker,
            "analysis": analysis,
            "timestamp": str(__import__("datetime").datetime.utcnow().isoformat()),
            "model_used": MODEL
        }
        
    except json.JSONDecodeError as e:
        return {
            "status": "error",
            "ticker": ticker,
            "error": "Failed to parse AI response",
            "details": str(e)
        }
    except Exception as e:
        return {
            "status": "error",
            "ticker": ticker,
            "error": str(type(e).__name__),
            "details": str(e)
        }

"""
Best Buy recommendation analyzer.
Analyzes all current signals and recommends the best stocks to buy today.
"""

import os
import json
from typing import Optional, Dict, Any, List
from openai import OpenAI

# Initialize OpenAI client
client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    base_url=os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
)

MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")


def get_best_buy_recommendation(
    all_signals: List[Dict[str, Any]],
    market_mode: str = "global"
) -> Dict[str, Any]:
    """
    Analyze all current signals and recommend the best stocks to buy today.
    
    Args:
        all_signals: List of signal dicts with ticker, signal, price, technical, sentiment, etc.
        market_mode: 'global' or 'indian' to customize recommendations
        
    Returns:
        Dict with top recommendations and reasoning
    """
    
    try:
        if not all_signals:
            return {
                "status": "no_data",
                "message": "No signal data available for analysis"
            }
        
        # Filter to only recent signals (last 2 hours) and sort by score
        recent_signals = sorted(
            all_signals,
            key=lambda s: s.get("final_score", 0),
            reverse=True
        )[:10]
        
        # Build signal summary for AI prompt
        signal_summary = "\n".join([
            f"• {s['ticker']}: {s['signal']} (Score: {s.get('final_score', 0):.3f}, Price: ${s.get('price', 0):.2f}, RSI: {s.get('rsi', 0):.1f})"
            for s in recent_signals
        ])
        
        # Market context
        market_context = "Indian Stock Market (NSE)" if market_mode == "indian" else "Global Stock Market"
        market_type = "Indian large-cap and mid-cap stocks" if market_mode == "indian" else "US-listed tech and mega-cap stocks"
        
        prompt = f"""You are a professional stock market analyst providing daily trading recommendations.

MARKET: {market_context}
STOCK TYPE: {market_type}
DATE: Today's trading session

AVAILABLE SIGNALS (Top Candidates):
{signal_summary}

Based on the comprehensive signal data above, provide the TOP 2-3 stocks I should focus on buying TODAY.

For each recommendation, explain:
1. Why it's a good buy today (technical + sentiment)
2. Entry price range
3. Target price for today/this week
4. Key risk factors

Provide response as JSON:
{{
    "top_recommendations": [
        {{
            "ticker": "SYMBOL",
            "rank": 1,
            "buy_reason": "Brief explanation of why to buy today",
            "technical_reason": "RSI/MA crossover/etc",
            "sentiment_reason": "News/social sentiment",
            "entry_price": 123.45,
            "target_price_today": 125.00,
            "target_price_week": 128.00,
            "risk_factors": ["risk1", "risk2"],
            "confidence": 8
        }}
    ],
    "market_outlook": "Brief market sentiment for today",
    "best_time_to_buy": "Market open? Afternoon dip? etc",
    "portfolio_suggestion": "If you had to pick ONE, which would it be?"
}}

Be concise, actionable, and confident in your recommendations."""

        # Call OpenAI API
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert financial analyst providing daily trading recommendations. Always respond with valid JSON."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.8,
            max_tokens=1200,
            response_format={"type": "json_object"}
        )
        
        # Parse response
        analysis_text = response.choices[0].message.content
        if not analysis_text:
            return {
                "status": "error",
                "error": "No content in AI response"
            }
        
        analysis = json.loads(analysis_text)
        
        return {
            "status": "success",
            "market_mode": market_mode,
            "analysis": analysis,
            "timestamp": str(__import__("datetime").datetime.utcnow().isoformat()),
            "model_used": MODEL,
            "signals_analyzed": len(recent_signals)
        }
        
    except json.JSONDecodeError as e:
        return {
            "status": "error",
            "error": "Failed to parse AI response",
            "details": str(e)
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(type(e).__name__),
            "details": str(e)
        }

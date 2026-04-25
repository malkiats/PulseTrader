"""
Multi-factor signal engine.

v1 logic  : rule-based (RSI + MA crossover + sentiment)
v2 logic  : weighted scoring (technical + sentiment + event + fundamental)
"""
import logging
from typing import TypedDict, Optional, Literal
from config import settings

logger = logging.getLogger(__name__)

SignalValue = Literal["BUY", "SELL", "HOLD"]


class SignalOutput(TypedDict):
    ticker: str
    signal: SignalValue
    price: Optional[float]
    rsi: Optional[float]
    ma50: Optional[float]
    ma200: Optional[float]
    sentiment_score: Optional[float]
    technical_score: Optional[float]
    event_score: Optional[float]
    fundamental_score: Optional[float]
    final_score: Optional[float]


def _technical_score(rsi: Optional[float], ma50: Optional[float], ma200: Optional[float]) -> float:
    """
    Normalises technical indicators into a score in [-1, +1].
    RSI component: map [0-30] → +1, [30-70] → 0, [70-100] → -1
    MA component:  MA50 > MA200 → +1, else -1
    """
    components: list[float] = []

    if rsi is not None:
        if rsi < settings.RSI_OVERSOLD:
            rsi_comp = 1.0
        elif rsi > settings.RSI_OVERBOUGHT:
            rsi_comp = -1.0
        else:
            # linear interpolation between 30 and 70
            rsi_comp = 1.0 - 2.0 * (rsi - settings.RSI_OVERSOLD) / (
                settings.RSI_OVERBOUGHT - settings.RSI_OVERSOLD
            )
        components.append(rsi_comp)

    if ma50 is not None and ma200 is not None:
        ma_comp = 1.0 if ma50 > ma200 else -1.0
        components.append(ma_comp)

    if not components:
        return 0.0
    return round(sum(components) / len(components), 5)


def generate_signal(
    ticker: str,
    indicators: dict,
    sentiment_score: float = 0.0,
    event_score: float = 0.0,
    fundamental_score: float = 0.0,
) -> SignalOutput:
    """
    Combines all factor scores into a final_score and produces a BUY/SELL/HOLD signal.

    final_score = technical * 0.40 + sentiment * 0.30 + event * 0.20 + fundamental * 0.10
    """
    price = indicators.get("price")
    rsi = indicators.get("rsi")
    ma50 = indicators.get("ma50")
    ma200 = indicators.get("ma200")

    tech_score = _technical_score(rsi, ma50, ma200)

    final_score = (
        tech_score          * settings.WEIGHT_TECHNICAL
        + sentiment_score   * settings.WEIGHT_SENTIMENT
        + event_score       * settings.WEIGHT_EVENT
        + fundamental_score * settings.WEIGHT_FUNDAMENTAL
    )
    final_score = round(final_score, 5)

    if final_score > settings.BUY_THRESHOLD:
        signal: SignalValue = "BUY"
    elif final_score < settings.SELL_THRESHOLD:
        signal = "SELL"
    else:
        signal = "HOLD"

    logger.info(
        "%s → %s | final=%.3f tech=%.3f sent=%.3f evt=%.3f",
        ticker, signal, final_score, tech_score, sentiment_score, event_score,
    )

    return SignalOutput(
        ticker=ticker,
        signal=signal,
        price=price,
        rsi=rsi,
        ma50=ma50,
        ma200=ma200,
        sentiment_score=sentiment_score,
        technical_score=tech_score,
        event_score=event_score,
        fundamental_score=fundamental_score,
        final_score=final_score,
    )

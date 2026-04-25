"""
NLP sentiment analysis using VADER (fast, CPU-friendly) or FinBERT.
The analyser is a singleton loaded once at startup.
"""
import logging
from typing import Literal, TypedDict
from config import settings

logger = logging.getLogger(__name__)

SentimentLabel = Literal["positive", "negative", "neutral"]


class SentimentResult(TypedDict):
    label: SentimentLabel
    score: float  # range: -1.0 (very negative) to +1.0 (very positive)


# ── Singleton holder ─────────────────────────────────────────
_vader = None
_finbert_pipeline = None


def _get_vader():
    global _vader
    if _vader is None:
        from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
        _vader = SentimentIntensityAnalyzer()
        logger.info("VADER loaded.")
    return _vader


def _get_finbert():
    global _finbert_pipeline
    if _finbert_pipeline is None:
        try:
            from transformers import pipeline
        except ImportError as exc:
            raise RuntimeError(
                "FinBERT dependencies are not installed. "
                "Install transformers/torch on a supported Python version, "
                "or set USE_FINBERT=False."
            ) from exc
        _finbert_pipeline = pipeline(
            "text-classification",
            model=settings.FINBERT_MODEL,
            truncation=True,
            max_length=512,
        )
        logger.info("FinBERT loaded.")
    return _finbert_pipeline


# ── Analyser functions ───────────────────────────────────────

def _vader_score(text: str) -> SentimentResult:
    analyzer = _get_vader()
    scores = analyzer.polarity_scores(text)
    compound = scores["compound"]  # -1 to +1
    if compound >= 0.05:
        label: SentimentLabel = "positive"
    elif compound <= -0.05:
        label = "negative"
    else:
        label = "neutral"
    return SentimentResult(label=label, score=round(compound, 5))


def _finbert_score(text: str) -> SentimentResult:
    pipe = _get_finbert()
    result = pipe(text)[0]
    raw_label: str = result["label"].lower()
    confidence: float = result["score"]
    label_map: dict[str, SentimentLabel] = {
        "positive": "positive",
        "negative": "negative",
        "neutral": "neutral",
    }
    label = label_map.get(raw_label, "neutral")
    sign = 1.0 if label == "positive" else (-1.0 if label == "negative" else 0.0)
    score = round(sign * confidence, 5)
    return SentimentResult(label=label, score=score)


def analyse(text: str) -> SentimentResult:
    """Score a single headline. Uses FinBERT if USE_FINBERT=True, else VADER."""
    if not text or not text.strip():
        return SentimentResult(label="neutral", score=0.0)
    try:
        if settings.USE_FINBERT:
            try:
                return _finbert_score(text)
            except Exception as exc:
                logger.warning("FinBERT unavailable, falling back to VADER: %s", exc)
                return _vader_score(text)
        return _vader_score(text)
    except Exception as exc:
        logger.error("Sentiment analysis failed: %s", exc)
        return SentimentResult(label="neutral", score=0.0)


def analyse_batch(texts: list[str]) -> list[SentimentResult]:
    """Score a list of headlines, falling back gracefully on errors."""
    return [analyse(t) for t in texts]


def aggregate_sentiment(results: list[SentimentResult]) -> float:
    """Average compound score across all headlines for a ticker. Returns 0 if empty."""
    if not results:
        return 0.0
    return round(sum(r["score"] for r in results) / len(results), 5)

"""
Orchestration: runs the full signal pipeline on a schedule.
"""
import logging
from datetime import datetime, timezone
from config import settings
from data.market_data import fetch_all
from data.news_fetcher import fetch_all_news
from data.news_classifier import classify_news
from data.event_detector import detect_event
from indicators.technical import compute_indicators, latest_indicators
from sentiment.analyzer import analyse, aggregate_sentiment
from strategy.signal_engine import generate_signal
from db.supabase_client import insert_signal, insert_news_items

logger = logging.getLogger(__name__)


def run_signal_pipeline() -> None:
    """Full pipeline: market data → indicators → news+sentiment → signals → DB."""
    logger.info("─── Pipeline start %s ───", datetime.now(timezone.utc).isoformat())

    # 1. Market data + indicators
    market_data = fetch_all(settings.TICKERS)

    # 2. News + sentiment (run less frequently — every 5 min via scheduler)
    news_data = fetch_all_news(settings.TICKERS)

    for ticker in settings.TICKERS:
        try:
            df = market_data.get(ticker)
            articles = news_data.get(ticker, [])

            # ── Technical ──────────────────────────────────
            indicators: dict = {}
            if df is not None and not df.empty:
                df = compute_indicators(df)
                indicators = latest_indicators(df)

            # ── Sentiment + Event ──────────────────────────
            news_rows: list[dict] = []
            sentiment_results = []
            event_scores: list[float] = []

            for article in articles:
                title = article["title"]
                sentiment = analyse(title)
                category, weight = classify_news(title)
                _, event_score_raw = detect_event(title)

                # Weighted sentiment contribution
                relevance = 1.0  # could be 0.5 for indirect mentions
                weighted_score = sentiment["score"] * weight * relevance
                sentiment_results.append(
                    type("SR", (), {"score": weighted_score, "label": sentiment["label"]})()
                )
                event_scores.append(event_score_raw)

                news_rows.append(
                    {
                        "ticker": ticker,
                        "title": title,
                        "source": article.get("source"),
                        "url": article.get("url"),
                        "published_at": article.get("published_at"),
                        "sentiment_label": sentiment["label"],
                        "sentiment_score": sentiment["score"],
                        "news_category": category,
                        "impact_weight": weight,
                    }
                )

            # Persist news
            insert_news_items(news_rows)

            agg_sentiment = (
                sum(r.score for r in sentiment_results) / len(sentiment_results)
                if sentiment_results else 0.0
            )
            agg_event = (
                sum(event_scores) / len(event_scores) if event_scores else 0.0
            )

            # ── Generate Signal ────────────────────────────
            if not indicators:
                logger.warning("No indicators for %s — skipping signal.", ticker)
                continue

            output = generate_signal(
                ticker=ticker,
                indicators=indicators,
                sentiment_score=round(agg_sentiment, 5),
                event_score=round(agg_event, 5),
            )

            insert_signal(dict(output))

        except Exception as exc:
            logger.exception("Pipeline error for %s: %s", ticker, exc)

    logger.info("─── Pipeline complete ───")

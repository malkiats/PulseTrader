"""Aggregate news headlines per ticker from NewsAPI and RSS feeds."""
import logging
import hashlib
import time
from typing import TypedDict, Optional
import feedparser
import requests
from config import settings

logger = logging.getLogger(__name__)


class NewsArticle(TypedDict):
    ticker: str
    title: str
    source: Optional[str]
    url: Optional[str]
    published_at: Optional[str]


# URL-hash dedup set (reset per run, persists across tickers in one run)
_seen_urls: set[str] = set()

# TTL cache: {ticker: (fetched_at, articles)}
_news_cache: dict[str, tuple[float, list[NewsArticle]]] = {}
CACHE_TTL = 290  # seconds


def _url_hash(url: Optional[str]) -> str:
    return hashlib.md5((url or "").encode()).hexdigest()


def fetch_newsapi(ticker: str) -> list[NewsArticle]:
    """Fetch headlines from NewsAPI for a given ticker."""
    if not settings.NEWS_API_KEY:
        return []
    try:
        resp = requests.get(
            "https://newsapi.org/v2/everything",
            params={
                "q": ticker,
                "language": "en",
                "sortBy": "publishedAt",
                "pageSize": settings.NEWS_ITEMS_PER_TICKER,
                "apiKey": settings.NEWS_API_KEY,
            },
            timeout=10,
        )
        resp.raise_for_status()
        articles: list[NewsArticle] = []
        for a in resp.json().get("articles", []):
            url = a.get("url")
            h = _url_hash(url)
            if h in _seen_urls:
                continue
            _seen_urls.add(h)
            articles.append(
                NewsArticle(
                    ticker=ticker,
                    title=a.get("title") or "",
                    source=a.get("source", {}).get("name"),
                    url=url,
                    published_at=a.get("publishedAt"),
                )
            )
        return articles
    except Exception as exc:
        logger.error("NewsAPI error for %s: %s", ticker, exc)
        return []


def fetch_rss(ticker: str) -> list[NewsArticle]:
    """Fetch headlines from Yahoo Finance RSS for a ticker."""
    url = f"https://feeds.finance.yahoo.com/rss/2.0/headline?s={ticker}&region=US&lang=en-US"
    try:
        feed = feedparser.parse(url)
        articles: list[NewsArticle] = []
        for entry in feed.entries[: settings.NEWS_ITEMS_PER_TICKER]:
            link = entry.get("link")
            h = _url_hash(link)
            if h in _seen_urls:
                continue
            _seen_urls.add(h)
            published = entry.get("published")
            articles.append(
                NewsArticle(
                    ticker=ticker,
                    title=entry.get("title") or "",
                    source="Yahoo Finance RSS",
                    url=link,
                    published_at=published,
                )
            )
        return articles
    except Exception as exc:
        logger.error("RSS error for %s: %s", ticker, exc)
        return []


def fetch_news(ticker: str) -> list[NewsArticle]:
    """Aggregate news from all sources with TTL caching."""
    now = time.time()
    if ticker in _news_cache:
        fetched_at, cached = _news_cache[ticker]
        if now - fetched_at < CACHE_TTL:
            return cached

    articles = fetch_newsapi(ticker) + fetch_rss(ticker)
    # Deduplicate titles
    seen_titles: set[str] = set()
    unique: list[NewsArticle] = []
    for a in articles:
        t = a["title"].strip().lower()
        if t and t not in seen_titles:
            seen_titles.add(t)
            unique.append(a)

    _news_cache[ticker] = (now, unique)
    logger.info("Fetched %d news items for %s", len(unique), ticker)
    return unique


def fetch_all_news(tickers: list[str]) -> dict[str, list[NewsArticle]]:
    """Fetch news for every ticker."""
    return {ticker: fetch_news(ticker) for ticker in tickers}

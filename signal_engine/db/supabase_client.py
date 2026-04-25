"""Supabase client using the service-role key (bypasses RLS for writes)."""
import logging
from supabase import create_client, Client
from config import settings

logger = logging.getLogger(__name__)

_client: Client | None = None


def get_client() -> Client:
    global _client
    if _client is None:
        _client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
        logger.info("Supabase client initialised.")
    return _client


def insert_signal(signal: dict) -> None:
    """Upsert a signal record into the signals table."""
    try:
        get_client().table("signals").insert(signal).execute()
    except Exception as exc:
        logger.error("Failed to insert signal: %s", exc)


def insert_news_items(items: list[dict]) -> None:
    """Bulk-insert news items, ignoring URL duplicates."""
    if not items:
        return
    try:
        # on_conflict='url' silently skips duplicates where url is not null
        get_client().table("news_items").upsert(
            items, on_conflict="url", ignore_duplicates=True
        ).execute()
    except Exception as exc:
        logger.error("Failed to insert news items: %s", exc)


def insert_market_data(rows: list[dict]) -> None:
    """Bulk-insert OHLCV rows."""
    if not rows:
        return
    try:
        get_client().table("market_data").insert(rows).execute()
    except Exception as exc:
        logger.error("Failed to insert market data: %s", exc)

"""Detect market-moving events in news headlines and return an event_score."""
import re
from typing import Optional

# Event keyword map → raw score contribution
_EVENT_PATTERNS: list[tuple[str, float, list[str]]] = [
    # (event_label, score_contribution, keywords)
    ("earnings_beat",   +0.8, ["beat", "beats", "exceeded", "surpassed", "above expectations"]),
    ("earnings_miss",   -0.8, ["miss", "misses", "missed", "below expectations", "disappoints"]),
    ("revenue_growth",  +0.6, ["revenue growth", "record revenue", "all-time high"]),
    ("acquisition",     +0.5, ["acquir", "merger", "buyout"]),
    ("ceo_resign",      -0.4, ["ceo resign", "ceo steps down", "ceo departs"]),
    ("ceo_appointed",   +0.2, ["new ceo", "ceo appointed", "names ceo"]),
    ("lawsuit",         -0.5, ["sued", "lawsuit", "legal action", "faces charges"]),
    ("product_ban",     -0.6, ["banned", "ban", "blocked", "restricted"]),
    ("product_launch",  +0.4, ["launches", "unveiled", "announces new", "releases"]),
    ("dividend",        +0.3, ["dividend", "buyback", "share repurchase"]),
    ("layoff",          -0.3, ["layoff", "lay off", "job cut", "workforce reduction"]),
    ("ipo",             +0.3, ["ipo", "goes public", "initial public offering"]),
    ("partnership",     +0.3, ["partnership", "collaboration", "deal with"]),
    ("recall",          -0.6, ["recall", "safety issue", "defect"]),
]


def detect_event(title: str) -> tuple[Optional[str], float]:
    """
    Returns (event_label or None, event_score in [-1, +1]).
    Scores are clipped to [-1, +1].
    """
    lower = title.lower()
    total_score: float = 0.0
    detected_label: Optional[str] = None

    for label, contrib, keywords in _EVENT_PATTERNS:
        if any(kw in lower for kw in keywords):
            total_score += contrib
            if detected_label is None:
                detected_label = label

    # Clip to [-1, +1]
    clipped = max(-1.0, min(1.0, total_score))
    return detected_label, clipped

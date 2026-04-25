"""Classify a news article into a category and assign an impact weight."""
from typing import Literal

NewsCategory = Literal[
    "earnings", "regulation", "acquisition", "leadership",
    "legal", "product", "macro", "opinion", "general"
]

# Impact weights per category (used in weighted sentiment formula)
CATEGORY_WEIGHTS: dict[str, float] = {
    "earnings":    1.0,
    "regulation":  0.9,
    "acquisition": 0.8,
    "leadership":  0.7,
    "legal":       0.8,
    "product":     0.6,
    "macro":       0.6,
    "opinion":     0.3,
    "general":     0.4,
}

# Keyword mapping — order matters (first match wins)
_KEYWORD_MAP: list[tuple[str, list[str]]] = [
    ("earnings",    ["earnings", "revenue", "profit", "eps", "quarterly", "guidance", "forecast"]),
    ("regulation",  ["regulation", "banned", "regulator", "sec", "ftc", "antitrust", "fine", "penalty"]),
    ("acquisition", ["acqui", "merger", "takeover", "buyout", "deal", "acquire"]),
    ("leadership",  ["ceo", "cfo", "cto", "resign", "appoint", "executive", "founder"]),
    ("legal",       ["lawsuit", "sued", "court", "legal", "settlement", "investigation"]),
    ("product",     ["launch", "product", "iphone", "release", "feature", "update", "new model"]),
    ("macro",       ["fed", "interest rate", "inflation", "gdp", "recession", "economy", "tariff"]),
    ("opinion",     ["analyst", "rating", "upgrade", "downgrade", "target price", "price target", "predict"]),
]


def classify_news(title: str) -> tuple[str, float]:
    """
    Returns (category, impact_weight) for a news headline.
    Falls back to ('general', 0.4).
    """
    lower = title.lower()
    for category, keywords in _KEYWORD_MAP:
        if any(kw in lower for kw in keywords):
            return category, CATEGORY_WEIGHTS[category]
    return "general", CATEGORY_WEIGHTS["general"]

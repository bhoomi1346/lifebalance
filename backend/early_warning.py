"""
Early-warning rules (SRS FR-4.6 and SAF-2).
Input: daily stress levels, oldest first, for the most recent days.
Output: None, or a gentle message for the dashboard.
"""

HIGH_STREAK = 3          # FR-4.6: High for 3 consecutive days
PERSISTENT_HIGH = 5      # SAF-2: High on 5 or more days in a week
SCORE = {"Low": 0, "Moderate": 1, "High": 2}


def check_warning(levels_oldest_first):
    """levels_oldest_first: e.g. ["Low", "High", "High", "High"]. Returns a dict or None."""
    levels = [l for l in levels_oldest_first if l in SCORE]
    if not levels:
        return None

    last_week = levels[-7:]
    high_days_week = sum(1 for l in last_week if l == "High")

    # Rule 1: High for 3 consecutive days (most recent run)
    streak = 0
    for l in reversed(levels):
        if l == "High":
            streak += 1
        else:
            break

    if high_days_week >= PERSISTENT_HIGH:
        return {
            "type": "persistent_high",
            "title": "Your stress has been high for several days",
            "message": "You have had high stress on most days this week. It may help to talk "
                       "with a trusted person or a qualified professional about how you are doing.",
        }

    if streak >= HIGH_STREAK:
        return {
            "type": "high_streak",
            "title": "Your stress has been high for a few days in a row",
            "message": "Try to take short breaks, rest where you can, and keep an eye on your sleep. "
                       "If it continues, consider speaking with someone you trust.",
        }

    # Rule 2: rising trend across the last 7 days (compare first half to second half)
    if len(levels) >= 6:
        window = levels[-6:]
        first = sum(SCORE[l] for l in window[:3]) / 3
        second = sum(SCORE[l] for l in window[3:]) / 3
        if second - first >= 1.0:
            return {
                "type": "rising_trend",
                "title": "Your stress is trending upward",
                "message": "Your recent days show more stress than earlier in the week. "
                           "Small changes to sleep and breaks may help.",
            }

    return None
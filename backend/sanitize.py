import re

CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
HTML_TAGS = re.compile(r"<[^>]*>")


def clean_text(value, max_len=100):
    """Removes HTML tags and control characters, trims spaces, and limits the length."""
    if value is None:
        return ""
    text = HTML_TAGS.sub("", str(value))
    text = CONTROL_CHARS.sub("", text)
    return text.strip()[:max_len]


def safe_error(context, exc):
    """Logs only the kind of error. Database errors can contain the values being saved,
    so the message text is never printed (SRS SR-8)."""
    print(f"{context}: {type(exc).__name__}")
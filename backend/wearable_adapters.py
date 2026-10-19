import hashlib
import random
from datetime import date


class ProviderNotConfigured(Exception):
    """Raised when a real provider is selected but its access has not been set up."""


class WearableAdapter:
    """Every provider implements these three steps (SRS FR-10.2)."""
    provider = "base"

    def connect(self, user_id):
        raise NotImplementedError

    def fetch_day(self, user_id, day):
        raise NotImplementedError

    def disconnect(self, user_id):
        raise NotImplementedError


class MockAdapter(WearableAdapter):
    """Returns the same sample values for the same user and day, so results are repeatable."""
    provider = "mock"

    def connect(self, user_id):
        return {"status": "connected", "scopes": "sleep,activity,steps,heart_rate"}

    def fetch_day(self, user_id, day: date):
        seed_text = f"{user_id}:{day.isoformat()}:mock-wearable"
        seed = int(hashlib.sha256(seed_text.encode()).hexdigest()[:8], 16)
        rng = random.Random(seed)
        return {
            "sleep_hours": round(rng.uniform(4.5, 8.5), 1),
            "steps": rng.randint(2000, 12000),
            "active_minutes": rng.randint(0, 90),
            "resting_hr": rng.randint(58, 85),
        }

    def disconnect(self, user_id):
        return {"status": "disconnected"}


class FitbitAdapter(WearableAdapter):
    """Placeholder for a real provider. It shows where the OAuth steps would go."""
    provider = "fitbit"

    def connect(self, user_id):
        raise ProviderNotConfigured(
            "Fitbit access is not set up for this project. Use the simulated provider instead.")

    def fetch_day(self, user_id, day):
        raise ProviderNotConfigured("Fitbit access is not set up for this project.")

    def disconnect(self, user_id):
        raise ProviderNotConfigured("Fitbit access is not set up for this project.")


ADAPTERS = {
    "mock": MockAdapter(),
    "fitbit": FitbitAdapter(),
}
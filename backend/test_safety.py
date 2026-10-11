from itertools import product
from recommender import build_recommendations

# Topics the app must never give advice on (SRS SAF-3)
BANNED = ["diet", "calorie", "fasting", "medication", "medicine", "pill", "supplement",
          "extreme", "lose weight", "weight loss", "diagnos", "treat"]

sleep_values = [3, 5, 7, 8, 10]
work_values = [0, 6, 8, 10, 13]
activity_values = [0, 15, 30, 90, 180]
water_values = [0.5, 1.5, 2.5, 5]
meal_values = ["Regular", "Slightly irregular", "Irregular"]
stress_values = ["Low", "Moderate", "High"]
mode_values = ["Remote", "Hybrid", "Office", None]

count = 0
for s, w, a, wa, m, st, mode in product(sleep_values, work_values, activity_values,
                                        water_values, meal_values, stress_values, mode_values):
    values = {"sleep_hours": s, "working_hours": w, "activity_minutes": a,
              "water_litres": wa, "meal_regularity": m}
    tips = build_recommendations(values, {"stress_level": st}, {"work_mode": mode})

    assert 1 <= len(tips) <= 5, (values, st, mode, len(tips))
    priorities = [t["priority"] for t in tips]
    assert priorities == sorted(priorities), (values, st, mode)
    for t in tips:
        text = t["text"].lower()
        for word in BANNED:
            assert word not in text, (word, t["text"])
    count += 1

print(f"Checked {count} combinations. All tips are safe, 1 to 5 tips each, sorted by priority.")
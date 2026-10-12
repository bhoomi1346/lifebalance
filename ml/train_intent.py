import os
import json
import joblib
import sklearn
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline, make_union
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.metrics import classification_report
from chatbot_intents import INTENTS

SEED = 42
MODEL_DIR = "models"
THRESHOLD = 0.5  # below this confidence the chatbot asks the user to rephrase (FR-7.6)

# Five extra examples per intent, so each reaches 20 (SRS FR-7.2 asks for 15 to 20)
EXTRA = {
    "greeting": ["hi, how are you today", "hello there friend", "good day to you", "hey bot", "hello again"],
    "sleep": ["I slept badly", "I keep waking up tired", "my bedtime keeps moving", "how long should I sleep for", "I cannot get to sleep"],
    "stress": ["I feel anxious and tense", "my workload is making me stressed", "I am worried all the time", "I feel mentally exhausted", "help me with stress"],
    "work_life_balance": ["I bring work home every night", "my job takes up all my evenings", "I feel I have no life outside work", "how do I balance career and family", "work keeps me from my hobbies"],
    "activity": ["I need to exercise more", "how many minutes of walking a day", "I barely move during the day", "suggest a fitness routine", "how much activity did I do today"],
    "hydration_food": ["how much water do I need each day", "I rarely drink water", "what should I eat during the day", "my eating schedule is irregular", "is my diet healthy"],
    "tips": ["what should I try next", "give me a useful idea", "any suggestions to help me today", "what do you recommend I do", "what small step can I take"],
    "report_request": ["show my report", "I need my report for this week", "send my monthly summary", "give me my progress report", "can I export my records"],
    "help": ["what can this app do", "how do I use the app", "explain the features to me", "I do not know what to ask", "how does the score work", "show me how to use the calendar", "how do I add a record"],
}

texts, labels = [], []
for intent, examples in INTENTS.items():
    for ex in examples + EXTRA.get(intent, []):
        texts.append(ex.lower())
        labels.append(intent)

print("Total examples:", len(texts))
print("Intents:", len(INTENTS))

def make_clf():
    features = make_union(
        TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True),
        TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 5), sublinear_tf=True),
    )
    return make_pipeline(features, LogisticRegression(max_iter=5000, C=10.0, class_weight="balanced"))

X_train, X_test, y_train, y_test = train_test_split(
    texts, labels, test_size=0.2, stratify=labels, random_state=SEED)

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)
scores = cross_val_score(make_clf(), texts, labels, cv=cv, scoring="f1_macro")
print(f"5-fold macro F1: {scores.mean():.3f} (+/- {scores.std():.3f})")

clf = make_clf().fit(X_train, y_train)
print("\nHold-out test report (20%):")
print(classification_report(y_test, clf.predict(X_test), digits=3, zero_division=0))

# Fit on every example for the saved model
final = make_clf().fit(texts, labels)
os.makedirs(MODEL_DIR, exist_ok=True)
path = f"{MODEL_DIR}/intent_classifier_v1.joblib"
joblib.dump(final, path)

with open(f"{MODEL_DIR}/intent_classifier_v1.json", "w") as fh:
    json.dump({
        "version": "v1",
        "intents": list(INTENTS.keys()),
        "examples": len(texts),
        "cv_macro_f1": round(float(scores.mean()), 4),
        "confidence_threshold": THRESHOLD,
        "sklearn_version": sklearn.__version__,
        "random_seed": SEED,
    }, fh, indent=2)

print("Saved", path)

# Quick check on sentences the user might type
sample = ["how much sleep do I need", "I feel really overwhelmed lately", "what can you do", "xyz qwerty"]
for s in sample:
    probs = final.predict_proba([s.lower()])[0]
    best = probs.argmax()
    intent = final.classes_[best] if probs[best] >= THRESHOLD else "unclear (ask to rephrase)"
    print(f"{s!r} -> {intent} ({probs[best]:.2f})")
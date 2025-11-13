# ai/intent_classifier.py
import os
import pickle
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from pathlib import Path

MODEL_DIR = Path("models/intent_model")
MODEL_PATH = MODEL_DIR / "intent_model.pkl"
VECTORIZER_PATH = MODEL_DIR / "vectorizer.pkl"

# TRAIN_DATA gốc + thêm mới để hỗ trợ task 2 và biến thể
TRAIN_DATA = [
    ("Chào bạn", "greeting"),
    ("Hello", "greeting"),
    ("Hi", "greeting"),
    ("Task nào tuần này có rủi ro?", "task_risk_query"),
    ("Task 1 có rủi ro không?", "task_risk_query"),
    ("Task 2 có rủi ro không?", "task_risk_query"),
    ("Task 3 có rủi ro cao không?", "task_risk_query"),
    ("Rủi ro của task 2 là gì?", "task_risk_query"),
    ("Ai nên làm task thiết kế UI?", "task_assignment"),
    ("Ai phù hợp làm task API?", "task_assignment"),
    ("Task 2 nên giao cho ai?", "task_assignment"),
    ("Tôi nên làm task nào trước?", "task_ordering"),
    ("Tôi cần học gì để làm tốt task backend?", "skill_suggestion"),
    ("Làm sao tăng năng suất tuần này?", "staff_productivity"),
    ("Làm task login như thế nào?", "help_guideline"),
    ("Kể chuyện cười đi", "out_of_scope"),
    ("Hôm nay thời tiết sao?", "out_of_scope"),
    ("kể chuyện", "out_of_scope"),
    ("chuyện cười", "out_of_scope"),
    ("kể một câu chuyện", "out_of_scope"),
]

def train_intent_model():
    texts, labels = zip(*TRAIN_DATA)
    vectorizer = TfidfVectorizer(ngram_range=(1, 2), lowercase=True)
    X = vectorizer.fit_transform(texts)

    model = LogisticRegression()
    model.fit(X, labels)

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    with open(VECTORIZER_PATH, "wb") as f:
        pickle.dump(vectorizer, f)

    print("Intent model (scikit-learn) trained!")

# Load model
_model = None
_vectorizer = None
if MODEL_PATH.exists() and VECTORIZER_PATH.exists():
    with open(MODEL_PATH, "rb") as f:
        _model = pickle.load(f)
    with open(VECTORIZER_PATH, "rb") as f:
        _vectorizer = pickle.load(f)

def predict_intent(text: str):
    if not _model or not _vectorizer:
        return "unknown", 0.0
    X = _vectorizer.transform([text.lower().strip()])
    prob = _model.predict_proba(X)[0]
    pred = _model.predict(X)[0]
    confidence = max(prob)
    return pred, float(confidence)
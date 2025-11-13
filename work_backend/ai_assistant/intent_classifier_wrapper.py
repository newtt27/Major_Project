# ai_assistant/intent_classifier_wrapper.py
import sys
import json
import os

# Thêm path để import ai.*
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

try:
    from ai.rule_engine import apply_rules
    from ai.intent_classifier import predict_intent
except Exception as e:
    print(json.dumps({"intent": "error", "error": str(e)}), file=sys.stderr)
    sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"intent": "unknown", "confidence": 0.0}))
        sys.exit(0)

    message = sys.argv[1].strip()

    # 1. Rule engine trước (ưu tiên)
    ruled, reply = apply_rules(message)
    if ruled:
        print(json.dumps({"intent": "out_of_scope" if "Xin lỗi" in reply else "greeting", "confidence": 1.0, "reply": reply}))
        sys.exit(0)

    # 2. ML model nếu không ruled
    intent, confidence = predict_intent(message)
    # Thêm threshold: conf thấp → unknown
    if confidence < 0.3:
        intent = "unknown"
        confidence = 0.0
    print(json.dumps({"intent": intent, "confidence": confidence}))
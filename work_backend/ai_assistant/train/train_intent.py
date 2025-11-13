# train/train_intent.py
import sys
import os

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

print(f"Project root: {ROOT_DIR}")

try:
    from ai.intent_classifier import train_intent_model
    from ai.assignment_bandit import retrain_bandit_from_history  # SỬA: Import hàm đúng để retrain
    from ai.risk_tgn import train_risk_model
    from database import SessionLocal
    print("Import tất cả module thành công!")
except Exception as e:
    print(f"Lỗi import: {e}")
    sys.exit(1)

def train_all():
    print("\nBắt đầu train toàn bộ AI models...\n")

    print("1. Training Intent Classifier...")
    train_intent_model()

    db = SessionLocal()
    try:
        print("2. Training Assignment Bandit Agent...")
        retrain_bandit_from_history(db)  # SỬA: Gọi hàm retrain đúng, không phải suggest_assignee_bandit

        print("3. Training Risk TGN Model...")
        train_risk_model(db)  # ĐÃ FIX → CHẠY MƯỢT
    except Exception as e:
        print(f"Lỗi khi train model dùng DB: {e}")
        print("   → Có thể chưa có dữ liệu lịch sử. Vẫn tiếp tục...")
    finally:
        db.close()

if __name__ == "__main__":
    train_all()
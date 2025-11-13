# risk_predictor_wrapper.py
import sys
import io
sys.path.append('ai')
from ai.risk_tgn import predict_risk_advanced
from database import SessionLocal

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
task_id = int(sys.argv[1])
db = SessionLocal()
try:
    result = predict_risk_advanced(task_id, db)
    score = result.get('risk_score', 0.5)
    level = result.get('risk_level', 'Thấp')  # Dùng risk_level thay vì tính lại
    print(f"{score},{level}")
except Exception as e:
    print(f"0.5,Thấp")  # Fallback nếu lỗi
finally:
    db.close()
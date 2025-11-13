# ai_assistant/assignment_suggester_wrapper.py
import sys
import os
import json

import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

try:
    from ai.assignment_bandit import suggest_assignee_bandit
    from database import SessionLocal
except Exception as e:
    print(json.dumps([]))  # Trả về array rỗng nếu lỗi
    sys.exit(1)

def main():
    if len(sys.argv) != 2:
        print(json.dumps([]))
        return

    task_id = sys.argv[1]
    if not task_id.isdigit():
        print(json.dumps([]))
        return

    db = SessionLocal()
    try:
        task_id_int = int(task_id)
        recommendations = suggest_assignee_bandit(task_id=task_id_int, db=db, top_k=3)
        print(json.dumps(recommendations, ensure_ascii=False))  # Trả về array trực tiếp
    except Exception as e:
        print(json.dumps([]))
    finally:
        db.close()

if __name__ == "__main__":
    main()
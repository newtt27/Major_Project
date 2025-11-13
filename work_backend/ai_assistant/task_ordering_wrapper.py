import sys
sys.path.append('ai')
from ai.task_ordering import suggest_task_order
from database import SessionLocal
import json

user_id = int(sys.argv[1])
db = SessionLocal()
try:
    result = suggest_task_order(user_id, db)
    print(json.dumps(result))
finally:
    db.close()
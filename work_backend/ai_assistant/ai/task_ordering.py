from sqlalchemy.orm import Session
from datetime import datetime

def suggest_task_order(user_id: int, db: Session) -> list:
    tasks = db.execute("""
        SELECT t.task_id, t.title, t.due_date, t.priority
        FROM TaskAssignments ta
        JOIN Tasks t ON ta.task_id = t.task_id
        WHERE ta.user_id = :uid AND t.status_name != 'done'
        ORDER BY t.due_date
    """, {"uid": user_id}).fetchall()

    now = datetime.now()
    scored = []
    for t in tasks:
        days_left = (t.due_date - now).days if t.due_date else 999
        priority_score = {"High": 3, "Medium": 2, "Low": 1}.get(t.priority, 1)
        score = priority_score * 10 + max(0, 10 - days_left)
        scored.append({"task_id": t.task_id, "title": t.title, "score": score})

    return sorted(scored, key=lambda x: x["score"], reverse=True)[:5]
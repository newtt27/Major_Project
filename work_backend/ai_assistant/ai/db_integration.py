from sqlalchemy.orm import Session
from datetime import datetime

def get_task_context(db: Session, task_id: int) -> dict:
    result = db.execute("""
        SELECT 
            t.title, t.due_date, t.priority, 
            COALESCE(tp.percentage_complete, 0) as progress,
            u.first_name || ' ' || u.last_name as assignee
        FROM Tasks t
        LEFT JOIN Taskprogresses tp ON t.task_id = tp.task_id AND tp.user_id IN (
            SELECT user_id FROM TaskAssignments WHERE task_id = t.task_id AND is_main_assignee
        )
        LEFT JOIN TaskAssignments ta ON t.task_id = ta.task_id AND ta.is_main_assignee
        LEFT JOIN Users u ON ta.user_id = u.user_id
        WHERE t.task_id = :tid
    """, {"tid": task_id}).fetchone()

    if not result:
        return {}

    skills = db.execute("""
        SELECT skill_name, required_level FROM Task_Required_Skills WHERE task_id = :tid
    """, {"tid": task_id}).fetchall()

    due_in = (result.due_date.date() - datetime.now().date()).days if result.due_date else None

    return {
        "title": result.title,
        "progress": result.progress,
        "due_in_days": due_in,
        "priority": result.priority,
        "assignee": result.assignee or "Chưa có",
        "required_skills": [f"{s[0]} ≥ {s[1]}" for s in skills]
    }
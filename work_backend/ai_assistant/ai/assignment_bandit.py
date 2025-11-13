# ai/assignment_bandit.py
import numpy as np
import pickle
import os
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Dict
import logging
from sqlalchemy import text
import pytz

MODEL_DIR = "models"
MODEL_PATH = os.path.join(MODEL_DIR, "linucb_assignment.pkl")
os.makedirs(MODEL_DIR, exist_ok=True)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LinUCB:
    def __init__(self, n_features: int, alpha: float = 1.0):
        self.alpha = alpha
        self.n_features = n_features
        self.A = {}
        self.b = {}
        self.theta = {}

    def _get_user_params(self, user_id: int):
        if user_id not in self.A:
            self.A[user_id] = np.eye(self.n_features)
            self.b[user_id] = np.zeros((self.n_features, 1))
            self.theta[user_id] = np.zeros((self.n_features, 1))
        return self.A[user_id], self.b[user_id]

    def predict(self, user_id: int, context: np.ndarray) -> float:
        if context is None or len(context) == 0:
            return 0.0
        A, b = self._get_user_params(user_id)
        theta = np.linalg.inv(A) @ b
        context = context.reshape(-1, 1)
        ucb = theta.T @ context + self.alpha * np.sqrt(context.T @ np.linalg.inv(A) @ context)
        return float(ucb.item())

    def update(self, user_id: int, context: np.ndarray, reward: float):
        if context is None:
            return
        A, b = self._get_user_params(user_id)
        context = context.reshape(-1, 1)
        A += context @ context.T
        b += reward * context
        self.theta[user_id] = np.linalg.inv(A) @ b

    def save(self, path: str):
        data = {
            'A': self.A,
            'b': self.b,
            'theta': self.theta,
            'alpha': self.alpha,
            'n_features': self.n_features
        }
        with open(path, 'wb') as f:
            pickle.dump(data, f)

    @classmethod
    def load(cls, path: str) -> 'LinUCB':
        if not os.path.exists(path):
            return cls(n_features=5, alpha=1.5)
        try:
            with open(path, 'rb') as f:
                data = pickle.load(f)
            agent = cls(n_features=data.get('n_features', 5), alpha=data.get('alpha', 1.5))
            agent.A = data.get('A', {})
            agent.b = data.get('b', {})
            agent.theta = data.get('theta', {})
            return agent
        except Exception as e:
            logger.warning(f"Load model lỗi: {e}")
            return cls(n_features=5, alpha=1.5)


def get_context_vector(db: Session, user_id: int, task_id: int) -> np.ndarray:
    try:
        # 1. Skill match
        skill_match = db.execute(text("""
            SELECT COALESCE(AVG(us.level), 0.0)
            FROM User_Skills us
            JOIN Task_Required_Skills trs ON us.skill_name = trs.skill_name
            WHERE us.user_id = :uid AND trs.task_id = :tid AND us.level >= trs.required_level
        """), {"uid": user_id, "tid": task_id}).scalar() or 0.0

        # 2. Workload
        workload = db.execute(text("""
            SELECT COUNT(*) FROM TaskAssignments WHERE user_id = :uid
        """), {"uid": user_id}).scalar() or 0

        # 3. Urgency
        due_date = db.execute(text("SELECT due_date FROM Tasks WHERE task_id = :tid"), {"tid": task_id}).scalar()
        urgency = 1.0
        if due_date:
            # ← FIX: Đồng bộ timezone
            now = datetime.now(pytz.UTC)  # hoặc pytz.timezone('Asia/Ho_Chi_Minh')
            if due_date.tzinfo is None:
                due_date = pytz.UTC.localize(due_date)  # nếu DB trả naive
            days_left = (due_date - now).days
            urgency = max(0.1, min(1.0, 10.0 / (days_left + 1)))

        # 4. Department match
        dept_match = db.execute(text("""
            SELECT COUNT(*) FROM Users u1
            JOIN Users u2 ON u1.department_id = u2.department_id
            WHERE u1.user_id = :uid AND u2.user_id IN (
                SELECT user_id FROM TaskAssignments WHERE task_id = :tid
            )
        """), {"uid": user_id, "tid": task_id}).scalar() or 0

        # 5. Past success
        past_success = db.execute(text("""
            SELECT COALESCE(AVG(CASE WHEN th.status_after_update = 'done' THEN 1.0 ELSE 0.0 END), 0.5)
            FROM Taskhistories th
            JOIN TaskAssignments ta ON th.task_id = ta.task_id AND ta.user_id = :uid
            WHERE th.user_id = :uid
        """), {"uid": user_id}).scalar() or 0.5

        # ← CHUYỂN Decimal → float
        from decimal import Decimal
        skill_match = float(skill_match) if isinstance(skill_match, Decimal) else float(skill_match)
        workload = float(workload) if isinstance(workload, Decimal) else float(workload)
        dept_match = float(dept_match) if isinstance(dept_match, Decimal) else float(dept_match)
        past_success = float(past_success) if isinstance(past_success, Decimal) else float(past_success)

        # Normalize workload
        workload_norm = min(workload / 10.0, 1.0)

        return np.array([skill_match, workload_norm, urgency, dept_match, past_success], dtype=float)

    except Exception as e:
        logger.error(f"get_context_vector error: {e}")
        return np.array([0.0, 0.5, 0.0, 0.0, 0.5], dtype=float)


def suggest_assignee_bandit(task_id: int, db: Session, top_k: int = 3) -> List[Dict]:
    # Kiểm tra task tồn tại
    exists = db.execute(text("SELECT 1 FROM Tasks WHERE task_id = :tid"), {"tid": task_id}).fetchone()
    if not exists:
        return []

    agent = LinUCB.load(MODEL_PATH)
    users = db.execute(text("SELECT user_id, first_name || ' ' || last_name AS name FROM Users")).fetchall()

    scored = []
    for user_id, name in users:
        context = get_context_vector(db, user_id, task_id)
        ucb_score = agent.predict(user_id, context)
        reason = "Tiềm năng khám phá"
        if context[0] > 0.6: reason = "Kỹ năng phù hợp"
        if context[3] > 0: reason += ", Cùng phòng ban"
        if context[4] > 0.7: reason += ", Lịch sử tốt"
        scored.append({
            "user_id": user_id,
            "name": name,
            "ucb_score": float(ucb_score),
            "reason": reason.strip(", ")
        })

    scored.sort(key=lambda x: x["ucb_score"], reverse=True)
    return scored[:top_k]

def retrain_bandit_from_history(db: Session):
    history = db.execute(text("""
        SELECT ta.user_id, th.task_id, 
               CASE WHEN th.status_after_update = 'done' THEN 1.0 
                    WHEN th.status_after_update = 'in_progress' THEN 0.5 
                    ELSE 0.0 END AS reward
        FROM TaskAssignments ta
        JOIN Taskhistories th ON ta.task_id = th.task_id AND ta.user_id = th.user_id
        WHERE th.status_after_update IS NOT NULL
    """)).fetchall()

    agent = LinUCB.load(MODEL_PATH) if os.path.exists(MODEL_PATH) else LinUCB(n_features=5)

    for row in history:
        user_id = row.user_id
        task_id = row.task_id
        reward = float(row.reward)  # ← CHUYỂN Decimal → float
        context = get_context_vector(db, user_id, task_id)
        agent.update(user_id, context, reward)

    agent.save(MODEL_PATH)
    logger.info("Bandit model retrained from history!")
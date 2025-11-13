# ai/assignment_bandit.py
import numpy as np
import pickle
import os
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Dict, Tuple
import logging
from sqlalchemy import text

MODEL_DIR = "models"
MODEL_PATH = os.path.join(MODEL_DIR, "linucb_assignment.pkl")
os.makedirs(MODEL_DIR, exist_ok=True)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LinUCB:
    def __init__(self, n_features: int, alpha: float = 1.0):
        self.alpha = alpha
        self.n_features = n_features
        # Tham số cho mỗi user
        self.A = {}  # user_id -> A matrix (d x d)
        self.b = {}  # user_id -> b vector (d x 1)
        self.theta = {}  # user_id -> theta (d x 1)

    def _get_user_params(self, user_id: int):
        if user_id not in self.A:
            self.A[user_id] = np.eye(self.n_features)
            self.b[user_id] = np.zeros((self.n_features, 1))
            self.theta[user_id] = np.zeros((self.n_features, 1))
        return self.A[user_id], self.b[user_id]

    def predict(self, user_id: int, context: np.ndarray) -> float:
        A, b = self._get_user_params(user_id)
        theta = np.linalg.inv(A) @ b
        context = context.reshape(-1, 1)
        ucb = theta.T @ context + self.alpha * np.sqrt(context.T @ np.linalg.inv(A) @ context)
        return ucb.item()

    def update(self, user_id: int, context: np.ndarray, reward: float):
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
    def load(cls, path: str):
        with open(path, 'rb') as f:
            data = pickle.load(f)
        agent = cls(n_features=data['n_features'], alpha=data['alpha'])
        agent.A = data['A']
        agent.b = data['b']
        agent.theta = data['theta']
        return agent


def get_context_vector(db: Session, user_id: int, task_id: int) -> np.ndarray:
    try:
        # 1. Skill match score
        skill_query = text("""
            SELECT trs.required_level, COALESCE(us.level, 0) as user_level
            FROM Task_Required_Skills trs
            LEFT JOIN User_skills us ON us.user_id = :uid AND us.skill_name = trs.skill_name
            WHERE trs.task_id = :tid
        """)
        reqs = db.execute(skill_query, {"uid": user_id, "tid": task_id}).fetchall()
        skill_match = sum(max(0, user_lvl - req_lvl + 1) for req_lvl, user_lvl in reqs) / max(len(reqs), 1) if reqs else 0.0

        # 2. Workload
        workload_query = text("""
            SELECT COUNT(*) FROM TaskAssignments ta
            JOIN Tasks t ON ta.task_id = t.task_id
            LEFT JOIN TaskStatuses ts ON ts.task_id = t.task_id AND ts.is_current = TRUE
            WHERE ta.user_id = :uid 
              AND ts.status_name NOT IN ('done', 'archived')
        """)
        active_tasks = db.execute(workload_query, {"uid": user_id}).scalar() or 0
        workload = max(0, active_tasks - 3) * 0.3

        # 3. Urgency
        from datetime import timezone  # Thêm dòng này nếu chưa có
        # hoặc import ở đầu file: from datetime import timezone

        due_query = text("SELECT due_date FROM Tasks WHERE task_id = :tid")
        due_date = db.execute(due_query, {"tid": task_id}).scalar()

        if due_date is None:
            days_left = 999
        else:
            # ĐẢM BẢO cả 2 đều có múi giờ (aware)
            now = datetime.now(timezone.utc)  # hoặc timezone(timedelta(hours=7)) nếu muốn +07
            if due_date.tzinfo is None:
                due_date = due_date.replace(tzinfo=timezone.utc)
            days_left = (due_date - now).days

        urgency = 1.0 if days_left < 3 else 0.5 if days_left < 7 else 0.0

        # 4. Department match
        dept_query = text("""
            SELECT pp.department_id 
            FROM ProjectParts pp
            JOIN Tasks t ON t.part_id = pp.part_id
            WHERE t.task_id = :tid
        """)
        task_dept = db.execute(dept_query, {"tid": task_id}).scalar()

        user_dept_query = text("SELECT department_id FROM Users WHERE user_id = :uid")
        user_dept = db.execute(user_dept_query, {"uid": user_id}).scalar()
        dept_match = 1.0 if task_dept and user_dept and task_dept == user_dept else 0.0

        # 5. Lịch sử thành công
        history_query = text("""
            SELECT AVG(CASE WHEN th.status_after_update = 'done' THEN 1.0 ELSE 0.0 END)
            FROM Taskhistories th
            JOIN TaskAssignments ta ON th.task_id = ta.task_id
            WHERE ta.user_id = :uid AND th.action LIKE '%Hoàn thành%'
        """)
        past_success = db.execute(history_query, {"uid": user_id}).scalar() or 0.5

        return np.array([
            skill_match,
            -workload,
            urgency,
            dept_match,
            past_success
        ], dtype=np.float32)

    except Exception as e:
        logger.warning(f"Lỗi khi tính context vector cho user {user_id}, task {task_id}: {e}")
        # Trả về vector trung bình nếu lỗi
        return np.array([0.5, 0.0, 0.0, 0.0, 0.5], dtype=np.float32)


def suggest_assignee_bandit(task_id: int, db: Session, top_k: int = 3) -> List[Dict]:
    # Load or init model
    if os.path.exists(MODEL_PATH):
        agent = LinUCB.load(MODEL_PATH)
    else:
        agent = LinUCB(n_features=5, alpha=1.5)

    candidates = db.execute("""
        SELECT u.user_id, u.first_name, u.last_name, u.department_id
        FROM Users u
        WHERE u.status = 'Active'
    """).fetchall()

    recommendations = []
    for uid, fname, lname, dept_id in candidates:
        context = get_context_vector(db, uid, task_id)
        ucb_score = agent.predict(uid, context)
        recommendations.append({
            "user_id": uid,
            "name": f"{fname} {lname}",
            "ucb_score": round(ucb_score, 3),
            "context": context.tolist()
        })

    # Sắp xếp & lấy top
    recommendations.sort(key=lambda x: x["ucb_score"], reverse=True)
    top_results = recommendations[:top_k]

    # Gắn lý do
    for r in top_results:
        ctx = np.array(r["context"])
        reasons = []
        if ctx[0] > 0.7: reasons.append("Kỹ năng phù hợp")
        if ctx[1] > -0.5: reasons.append("Workload thấp")
        if ctx[2] > 0.5: reasons.append("Task gấp")
        if ctx[3] > 0: reasons.append("Cùng phòng ban")
        if ctx[4] > 0.7: reasons.append("Lịch sử hoàn thành tốt")
        r["reason"] = ", ".join(reasons) if reasons else "Tiềm năng khám phá"

    return top_results

def update_bandit_on_completion(db: Session, task_id: int, user_id: int, is_success: bool):
    if not os.path.exists(MODEL_PATH):
        return

    agent = LinUCB.load(MODEL_PATH)
    context = get_context_vector(db, user_id, task_id)
    reward = 1.0 if is_success else 0.2
    agent.update(user_id, context, reward)
    agent.save(MODEL_PATH)
    logger.info(f"Updated LinUCB for user {user_id}, task {task_id}, reward: {reward}")

def retrain_bandit_from_history(db: Session):
    agent = LinUCB(n_features=5, alpha=1.5)

    # SỬA: Dùng text() để SQLAlchemy hiểu đây là SQL
    query = text("""
        SELECT 
            th.task_id, 
            ta.user_id,
            CASE 
                WHEN th.status_after_update = 'done' AND th.action LIKE '%Hoàn thành%' THEN 1 
                ELSE 0 
            END as success
        FROM Taskhistories th
        JOIN TaskAssignments ta ON th.task_id = ta.task_id AND ta.user_id = th.user_id
        WHERE th.action IN ('Hoàn thành', 'Cập nhật tiến độ', 'Quá hạn')
        LIMIT 1000
    """)

    try:
        history = db.execute(query).fetchall()
        if not history:
            logger.info("Không có dữ liệu lịch sử để train LinUCB → tạo model mới")
        else:
            for task_id, user_id, success in history:
                context = get_context_vector(db, user_id, task_id)
                reward = 1.0 if success else 0.1
                A, b = agent._get_user_params(user_id)
                A += np.outer(context, context)
                b += reward * context.reshape(-1, 1)
            logger.info(f"LinUCB retrained từ {len(history)} bản ghi lịch sử!")

        # Luôn save model (dù có dữ liệu hay không)
        agent.save(MODEL_PATH)
        logger.info("LinUCB model đã được lưu thành công!")

    except Exception as e:
        logger.warning(f"Lỗi khi retrain LinUCB: {e}")
        # Vẫn tạo model rỗng nếu lỗi
        agent.save(MODEL_PATH)
        logger.info("Đã tạo model LinUCB mặc định (rỗng)")
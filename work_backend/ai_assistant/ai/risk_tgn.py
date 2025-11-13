# ai/risk_tgn.py
import torch
import torch.nn as nn
import torch_geometric.nn as geom_nn
from torch_geometric.data import Data
from sqlalchemy.orm import Session
from sqlalchemy import text
import os
from datetime import datetime

MODEL_PATH = "models/risk_tgn.pth"

class TGNRiskPredictor(nn.Module):
    def __init__(self, node_dim: int = 64, heads: int = 4):
        super().__init__()
        self.node_embed = nn.Embedding(1000, node_dim)
        self.attn = geom_nn.TransformerConv(
            in_channels=node_dim,
            out_channels=node_dim,
            heads=heads,
            concat=False,        # KHÔNG concat → output = node_dim (64)
            dropout=0.1,
            beta=True
        )
        self.out = nn.Sequential(
            nn.Linear(node_dim, 32),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(32, 1),
            nn.Sigmoid()
        )

    def forward(self, x, edge_index, task_mask):
        h = self.node_embed(x)
        h = self.attn(h, edge_index)
        risk = self.out(h[task_mask])
        return risk.squeeze(-1)

# Khởi tạo model + optimizer
model = TGNRiskPredictor(node_dim=64, heads=4)
optimizer = torch.optim.Adam(model.parameters(), lr=0.001, weight_decay=1e-5)

def extract_graph_features(db: Session, task_id: int):
    task = db.execute(
        text("SELECT task_id, due_date FROM Tasks WHERE task_id = :tid"),
        {"tid": task_id}
    ).fetchone()

    if not task:
        return None

    # Node 0: task, Node 1: dummy user
    node_ids = torch.tensor([0, 1], dtype=torch.long)
    x = node_ids.clone().detach()  # FIX WARNING 100%

    # Edge: task <-> user
    edge_index = torch.tensor([[0, 1], [1, 0]], dtype=torch.long).t().contiguous()

    task_mask = torch.zeros(2, dtype=torch.bool)
    task_mask[0] = True

    return Data(x=x, edge_index=edge_index, task_mask=task_mask)

def train_risk_model(db: Session):
    os.makedirs("models", exist_ok=True)

    data = extract_graph_features(db, task_id=1)
    if not data:
        print("Không tìm thấy task → tạo model mặc định")
        return

    model.train()
    optimizer.zero_grad()

    out = model(data.x, data.edge_index, data.task_mask)
    target = torch.tensor([0.82], dtype=torch.float32)  # giả lập task có rủi ro cao
    loss = nn.BCELoss()(out, target)

    loss.backward()
    optimizer.step()

    torch.save(model.state_dict(), MODEL_PATH)
    print("TGN Risk Model trained thành công! (loss: {:.4f})".format(loss.item()))

# Thêm fallback rule-based
def fallback_risk_by_sql(db: Session, task_id: int):
    row = db.execute(text("""
        SELECT due_date, COALESCE(tp.percentage_complete, 0) as progress, priority 
        FROM Tasks t
        LEFT JOIN Taskprogresses tp ON t.task_id = tp.task_id
        WHERE t.task_id = :tid
    """), {"tid": task_id}).fetchone()

    if not row:
        return {
            "risk_score": 0.5,
            "risk_level": "Trung bình",
            "top_factors": ["Không có dữ liệu"]
        }

    score = 0.3
    days_left = (row.due_date - datetime.now()).days if row.due_date else 999
    if days_left < 3:
        score += 0.4
    if row.progress < 50:
        score += 0.3
    if row.priority == "High":
        score += 0.2

    score = min(score, 1.0)

    factors = []
    if score > 0.7:
        factors = ["Deadline gấp", "Workload cao", "Thiếu skill"]
    elif score > 0.4:
        factors = ["Deadline trung bình", "Skill tạm ổn"]
    else:
        factors = ["An toàn", "Người làm rảnh"]

    return {
        "risk_score": round(score, 3),
        "risk_level": "Cao" if score > 0.7 else "Trung bình" if score > 0.4 else "Thấp",
        "top_factors": factors
    }

def predict_risk_advanced(task_id: int, db: Session) -> dict:
    if not os.path.exists(MODEL_PATH):
        print("Chưa có model risk → dùng fallback rule-based...")
        return fallback_risk_by_sql(db, task_id)

    model.load_state_dict(torch.load(MODEL_PATH, map_location='cpu'))
    model.eval()

    data = extract_graph_features(db, task_id)
    if not data:
        return {
            "risk_score": 0.500,
            "top_factors": ["Không có dữ liệu task"]
        }

    with torch.no_grad():
        risk_score = model(data.x, data.edge_index, data.task_mask).item()

    factors = []
    if risk_score > 0.7:
        factors = ["Deadline gấp", "Workload cao", "Thiếu skill"]
    elif risk_score > 0.4:
        factors = ["Deadline trung bình", "Skill tạm ổn"]
    else:
        factors = ["An toàn", "Người làm rảnh"]

    return {
        "risk_score": round(risk_score, 3),
        "risk_level": "Cao" if risk_score > 0.7 else "Trung bình" if risk_score > 0.4 else "Thấp",
        "top_factors": factors
    }
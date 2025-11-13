# router.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from schemas import ChatMessage, AIResponse
from utils import extract_task_id

# CHỈ IMPORT 2 HÀM MỚI
from ai import (
    apply_rules, predict_intent,
    predict_risk_advanced as predict_risk,
    suggest_assignee_rl as suggest_assignee,
    suggest_task_order,
    get_task_context, generate_response
)

router = APIRouter()

@router.post("/chat", response_model=AIResponse)
def chat(msg: ChatMessage, db: Session = Depends(get_db)):
    message = msg.message.strip()
    user_id = msg.user_id
    task_id = extract_task_id(message) or 1

    # 1. Rule engine
    ruled, reply = apply_rules(message)
    if ruled:
        return AIResponse(reply=reply)

    # 2. Intent
    intent, prob = predict_intent(message)
    data = {}
    action = None

    # RỦI RO → dùng TGN
    if "rủi ro" in message.lower() or intent == "task_risk_query":
        data = predict_risk(task_id, db)
        action = "risk"

    # PHÂN CÔNG → dùng RL
    elif "ai nên làm" in message.lower() or intent == "task_assignment":
        data = suggest_assignee(task_id, db)
        action = "assignment"

    # SẮP XẾP TASK
    elif "làm task nào trước" in message.lower() or intent == "task_ordering":
        data = {"priority": suggest_task_order(user_id, db)}
        action = "ordering"

    # THÔNG TIN TASK (mặc định)
    else:
        data = get_task_context(db, task_id)
        action = "info"

    # 3. LLM sinh câu trả lời tự nhiên
    reply = generate_response(message, data, db)

    return AIResponse(reply=reply, action=action, data=data)
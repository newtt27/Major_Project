# ai/__init__.py
from .rule_engine import apply_rules
from .intent_classifier import predict_intent
from .risk_tgn import predict_risk_advanced
from .assignment_bandit import suggest_assignee_bandit
from .task_ordering import suggest_task_order
from .db_integration import get_task_context
from .llm_client import generate_response


predict_risk = predict_risk_advanced
suggest_assignee = suggest_assignee_bandit
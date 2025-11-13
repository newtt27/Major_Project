import re

GREETING_KEYWORDS = ["hi", "hello", "chào", "hey", "alo"]
OUT_OF_SCOPE = ["joke", "truyện", "chuyện", "hát", "thời tiết", "bạn tên gì"]  # Thêm "chuyện"

def is_greeting(text: str) -> bool:
    return any(k in text.lower() for k in ["hi", "hello", "chào", "hey", "alo", "xin chào"])

def is_out_of_scope(text: str) -> bool:
    text = text.lower()
    if any(k in text for k in OUT_OF_SCOPE):
        return True
    # Thêm regex để bắt "kể chuyện", "chuyện cười", v.v.
    if re.search(r'(kể\s+chuyện|chuyện cười|kể\s+truyện|joke)', text):
        return True
    return False

def apply_rules(message: str) -> tuple[bool, str]:
    if is_greeting(message):
        return True, "Xin chào! Tôi là trợ lý AI. Hỏi tôi về task, rủi ro, phân công, hoặc hiệu suất nhé!"
    if is_out_of_scope(message):
        return True, "Xin lỗi, tôi chỉ hỗ trợ công việc. Hỏi về task, deadline, kỹ năng, hoặc báo cáo nhé!"
    return False, ""
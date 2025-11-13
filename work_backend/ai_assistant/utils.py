import re

def extract_task_id(text: str) -> int | None:
    match = re.search(r'task\s*#?(\d+)', text.lower())
    return int(match.group(1)) if match else None
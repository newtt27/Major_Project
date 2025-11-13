# main.py
from fastapi import FastAPI
from router import router
import uvicorn

app = FastAPI(title="Work AI Assistant")
app.include_router(router)

@app.get("/")
def home():
    return {"message": "AI Assistant Ready!"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)  # ← Port 8000
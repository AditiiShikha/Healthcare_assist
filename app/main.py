from fastapi import FastAPI
from app.simplifier import simplify_text
from app.detector import detect_manipulation
from app.schemas import TextRequest

app = FastAPI(title="Elder Health AI Service")

@app.get("/")
def home():
    return {"status": "AI Service Running"}

@app.post("/simplify")
def simplify(req: TextRequest):
    return {"simple": simplify_text(req.text)}

@app.post("/detect")
def detect(req: TextRequest):
    return detect_manipulation(req.text)

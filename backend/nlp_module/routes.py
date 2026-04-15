from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from model import WasteNLPClassifier


class ClassifyRequest(BaseModel):
    text: str


class ChatRequest(BaseModel):
    text: str


def build_router(classifier: WasteNLPClassifier) -> APIRouter:
    router = APIRouter()

    @router.post("/classify")
    def classify(payload: ClassifyRequest):
        text = payload.text.strip()
        if not text:
            raise HTTPException(status_code=400, detail="text cannot be empty")
        return classifier.classify(text)

    @router.post("/chat")
    def chat(payload: ChatRequest):
        text = payload.text.strip()
        if not text:
            raise HTTPException(status_code=400, detail="text cannot be empty")
        return classifier.chat(text)

    return router

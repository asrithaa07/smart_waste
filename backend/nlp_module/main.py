from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from model import WasteNLPClassifier
from routes import build_router


BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data.json"

classifier = WasteNLPClassifier(DATA_PATH)

app = FastAPI(
    title="Smart Waste NLP API",
    version="1.0.0",
    description="Lightweight NLP classifier for Organic / Plastic / Metal waste.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(build_router(classifier))


@app.get("/health")
def health():
    return {"status": "ok", "service": "smart-waste-nlp"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)

import json
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression
except Exception:
    TfidfVectorizer = None
    LogisticRegression = None


CATEGORIES = ["Organic", "Plastic", "Metal"]

DISPOSAL_INSTRUCTIONS = {
    "Organic": "Compost or wet waste bin",
    "Plastic": "Dry waste / recycling bin",
    "Metal": "Scrap / recycling center",
}


def _normalize(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text


class WasteNLPClassifier:
    def __init__(self, data_path: Path):
        self.data_path = data_path
        self.training_data = self._load_data()
        self.keyword_map = self._build_keyword_map(self.training_data)
        self.vectorizer = None
        self.model = None
        self._try_train_ml_model()

    def _load_data(self) -> List[Dict[str, str]]:
        with self.data_path.open("r", encoding="utf-8") as f:
            data = json.load(f)
        return data

    def _build_keyword_map(self, rows: List[Dict[str, str]]) -> Dict[str, str]:
        keyword_map: Dict[str, str] = {}
        for row in rows:
            item = _normalize(row["item"])
            category = row["category"]
            keyword_map[item] = category
            for token in item.split():
                if len(token) > 2 and token not in keyword_map:
                    keyword_map[token] = category
        return keyword_map

    def _try_train_ml_model(self) -> None:
        if TfidfVectorizer is None or LogisticRegression is None:
            return

        texts = [_normalize(row["item"]) for row in self.training_data]
        labels = [row["category"] for row in self.training_data]
        self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=1)
        x = self.vectorizer.fit_transform(texts)
        self.model = LogisticRegression(max_iter=500, random_state=42)
        self.model.fit(x, labels)

    def _keyword_predict(self, text: str) -> Optional[Tuple[str, float]]:
        normalized = _normalize(text)
        if not normalized:
            return None

        if normalized in self.keyword_map:
            return self.keyword_map[normalized], 0.99

        token_scores = {category: 0 for category in CATEGORIES}
        for token in normalized.split():
            matched_category = self.keyword_map.get(token)
            if matched_category:
                token_scores[matched_category] += 1

        best_category = max(token_scores, key=token_scores.get)
        best_score = token_scores[best_category]
        if best_score > 0:
            confidence = min(0.9, 0.6 + 0.1 * best_score)
            return best_category, confidence
        return None

    def _ml_predict(self, text: str) -> Optional[Tuple[str, float]]:
        if self.model is None or self.vectorizer is None:
            return None
        normalized = _normalize(text)
        if not normalized:
            return None
        x = self.vectorizer.transform([normalized])
        probabilities = self.model.predict_proba(x)[0]
        labels = self.model.classes_
        best_idx = int(probabilities.argmax())
        return str(labels[best_idx]), float(probabilities[best_idx])

    def classify(self, item_text: str) -> Dict[str, object]:
        keyword_result = self._keyword_predict(item_text)
        if keyword_result is not None:
            category, confidence = keyword_result
        else:
            ml_result = self._ml_predict(item_text)
            if ml_result is not None:
                category, confidence = ml_result
            else:
                category, confidence = "Organic", 0.34

        return {
            "item": item_text,
            "category": category,
            "disposal_instructions": DISPOSAL_INSTRUCTIONS[category],
            "confidence": round(float(confidence), 4),
        }

    def chat(self, message: str) -> Dict[str, str]:
        text = _normalize(message)

        if "plastic" in text:
            return {
                "answer": "Throw plastic waste in the dry waste / recycling bin.",
            }
        if "metal" in text:
            return {
                "answer": "Dispose metal in a scrap / recycling center.",
            }
        if "organic" in text or "wet waste" in text:
            return {
                "answer": "Organic waste goes to compost or a wet waste bin.",
            }
        if "where to throw" in text or "how to dispose" in text:
            return {
                "answer": (
                    "Tell me the waste type (Organic, Plastic, or Metal), "
                    "and I will guide you."
                ),
            }
        return {
            "answer": (
                "I can help with waste disposal. Try: "
                "'Where to throw plastic?' or 'How to dispose metal?'"
            )
        }

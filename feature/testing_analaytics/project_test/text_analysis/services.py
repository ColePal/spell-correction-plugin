import os
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
import torch, textstat

os.environ["CUDA_VISIBLE_DEVICES"] = ""
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")


emotion_model = "j-hartmann/emotion-english-distilroberta-base"
formality_model = "s-nlp/deberta-large-formality-ranker"
emotional_pipeline = pipeline("text-classification", model=emotion_model, tokenizer=emotion_model, top_k=None, device=-1)
formal_tokens  = AutoTokenizer.from_pretrained(formality_model)
form_model = AutoModelForSequenceClassification.from_pretrained(formality_model, torch_dtype=torch.float32)

form_model.to("cpu")
form_model.eval()
mapping = form_model.config.id2label

def text_input(text: str, n: int):
    if text != "":
        text = text.strip()
        if len(text) > n:
            return text[:n]
        else:
            return text

def evaluate(full_text: str, length: int = 600):
    text = text_input(full_text, length)
    if text=="" or len(text) < 2:
        return {"ok": True, "note": "Not enough text to analyse"}

    inputs = formal_tokens(text, return_tensors="pt", truncation=True, padding=True)
    with torch.no_grad():
        probabilities = torch.softmax(form_model(**inputs).logits, dim=-1)[0].tolist()

    formality_scores = {
        "label0": float(probabilities[0]),
        "label1": float(probabilities[1]),
    }

    if probabilities[0] >= probabilities[1]:
     result_formal = "Formal"
    else:
     result_formal ="Informal"


    emotion_scores = emotional_pipeline(text)[0]
    sorted_score_list = sorted(emotion_scores, key=lambda r: r["score"], reverse=True)
    top_emotion = sorted_score_list[:1]


    readability = {
        "flesch_reading_ease": textstat.flesch_reading_ease(text),
        "fk_grade": textstat.flesch_kincaid_grade(text),
        "gunning_fog": textstat.gunning_fog(text),
    }

    return {
        "ok": True,
        "emotion": {"top": top_emotion, "all": sorted_score_list},
        "formality": {"label": result_formal, "scores": formality_scores},
        "readability": readability,
    }

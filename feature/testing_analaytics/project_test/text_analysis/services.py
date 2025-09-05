import os

from sympy.stats.rv import probability
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
import torch, textstat
import fasttext
from project_test import settings

os.environ["CUDA_VISIBLE_DEVICES"] = ""
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")


emotion_model = "j-hartmann/emotion-english-distilroberta-base"
formality_model = "s-nlp/deberta-large-formality-ranker"
emotional_pipeline = pipeline("text-classification", truncation=True, max_length=512,  model=emotion_model, tokenizer=emotion_model, top_k=None, device=-1)
formal_tokens  = AutoTokenizer.from_pretrained(formality_model)
form_model = AutoModelForSequenceClassification.from_pretrained(formality_model, torch_dtype=torch.float32)
lang_model_path= settings.MODEL_DIRECTORY / "lid.176.ftz"
form_model.to("cpu")
form_model.eval()
mapping = form_model.config.id2label

def text_input(text: str, n: int):
        text = text.strip()
        text = text.replace("\r\n", " ").replace("\n", " ").replace("\r", " ")
        text = " ".join(text.split())
        if len(text) > n:
            return text[:n]
        else:
            return text


def language_detection(text: str,length: int = 600):
    text = text_input(text, length)
    threshold=0.60
    if len(text) < 3:
        return  "Need more text"
    labels, proba =fasttext.load_model(str(lang_model_path)).predict(text, k=3)
    pairs = []
    i = 0
    while i < len(labels):
        lab = labels[i]
        p = proba[i]
        clean = lab.replace("__label__", "")
        pairs.append((clean, float(p)))
        i = i + 1
    language = pairs[0][0]
    confidence = pairs[0][1]
    if confidence < threshold:
        language = "und"
    return language



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

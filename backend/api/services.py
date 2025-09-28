import os
from multiprocessing import Value

import fasttext
from django.db.models import CharField, Count
from django.db.models.functions import Coalesce
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
import torch

import textstat

from spellcorrector import settings
from .models import CorrectionRequest, CorrectedWord
from .textstat import flesch_reading_ease, flesch_kincaid_grade, gunning_fog

os.environ["CUDA_VISIBLE_DEVICES"] = ""
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")


emotion_model = "j-hartmann/emotion-english-distilroberta-base"
formality_model = "s-nlp/deberta-large-formality-ranker"
emotional_pipeline = pipeline("text-classification", model=emotion_model, tokenizer=emotion_model, top_k=None, device=-1)
formal_tokens  = AutoTokenizer.from_pretrained(formality_model)
form_model = AutoModelForSequenceClassification.from_pretrained(formality_model, torch_dtype=torch.float32)
lang_model_path= settings.MODEL_DIRECTORY / "lid.176.ftz"

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



def language_detection(text: str, length: int = 600):
    text = text_input(text, length)
    threshold = 0.60
    if len(text) < 3:
        return "Need more text"
    labels, probability = fasttext.load_model(str(lang_model_path)).predict(text, k=3)
    pairs = []
    for lab, p in zip(labels, probability):
       clean = lab.replace("__label__", "")
       pairs.append((clean, float(p)))
    language,confidence = pairs[0]
    if confidence < threshold:
      language = "Failed to recognize the language"
      return language
    if language == "en":
        language = "English"
    if language == "si":
        language="Sinhala"
    return language


def evaluate(full_text: str, length: int = 600):
    text = text_input(full_text, length)
    if text == "" or len(text) < 2:
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
        result_formal = "Informal"

    emotion_scores = emotional_pipeline(text)[0]
    sorted_score_list = sorted(emotion_scores, key=lambda r: r["score"], reverse=True)
    top_emotion = sorted_score_list[:1]

    try:
        readability = {
            "flesch_reading_ease": float(textstat.flesch_reading_ease(text)),
            "fk_grade": float(textstat.flesch_kincaid_grade(text)),
            "gunning_fog": float(textstat.gunning_fog(text)),
        }
    except Exception as e:
        readability = {"error": str(e)}

    return {
        "ok": True,
        "emotion": {"all": sorted_score_list},
        "formality": {"label": result_formal, "scores": formality_scores},
        "readability": readability,
    }

def all_languages():
    return ( CorrectionRequest.objects.annotate(detected_language=Coalesce('language', Value('undetected'),output_field=CharField()))
        .values('detected_language')
        .annotate(count=Count('id'))
        .order_by('-count'))


def most_misspelled_word():
    word=list(CorrectedWord.objects.values("incorrect_word").annotate(count=Count("id")) .order_by("-count")[:1])
    totals={
        "total_corrections": CorrectedWord.objects.count(),
        "unique_misspelled": CorrectedWord.objects.values("incorrect_word").distinct().count(),
        "unique_corrected": CorrectedWord.objects.values("corrected_word").distinct().count(),
        "total_requests": CorrectionRequest.objects.count(),
    }
    return word, totals

from transformers import T5ForConditionalGeneration, T5TokenizerFast, MT5ForConditionalGeneration, MT5Tokenizer
from difflib import SequenceMatcher
import torch
import logging
import requests
import os
from typing import Dict, Any, Optional #python stuff for typing

logger = logging.getLogger(__name__)

_models = {
    'en': None, # Vennify/Gemini
    'si': None,
    'hi': None,
}
_tokenizers = {
    'en': None,
    'si': None,
    'hi': None,
}
# API keys/urls
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
#Need url for "API endpoints for interacting with Gemini Models"
HUGGINGFACE_API_KEY = os.getenv('HUGGINGFACE_API_KEY', '')


def get_model(language='en'):
    global _models, _tokenizers

    if language not in ['en', 'si', 'hi']:
        language = 'en'

    if _models[language] is None:
        print(f"Loading {language.upper()} ")

        if language == 'en':
            model_name = "vennify/t5-base-grammar-correction"
            _models[language] = T5ForConditionalGeneration.from_pretrained(
                model_name,
                cache_dir="./model_cache"
            )
            _tokenizers[language] = T5TokenizerFast.from_pretrained(
                model_name,
                cache_dir="./model_cache"
            )
        else:
            model_name = "lm-spell/mt5-base-ft-ssc"
            _models[language] = MT5ForConditionalGeneration.from_pretrained(
                model_name,
                cache_dir="./model_cache"
            )
            _tokenizers[language] = MT5Tokenizer.from_pretrained(
                model_name,
                cache_dir="./model_cache"
            )

        _models[language].eval()
        print(f"{language.upper()}")

    return _models[language], _tokenizers[language]


def spell_correction_gemini(text: str) -> Dict[str, Any]:
    if not GEMINI_API_KEY:
        return {'original': text,
                'corrected': text,
                'success': False}

    prompt = f"""Fix any spelling and grammar errors in the following text.
       Return (Important) only the corrected text without any explanation or additional text.
       If there are no errors, return the text exactly as is.
       Do not add any formatting or quotes and if not english leave as is.
       Text: {text}"""

            # Definitions from GoogleAI Resource
            # "topK": 1
            # : This parameter limits the selection pool to only the single most probable next token at each step.
            # "topP": 1
            # : Also known as nucleus sampling, this parameter sets a cumulative probability threshold for token selection.
            # "temperature": 0.1
             #: This parameter controls the randomness of the model's output.
            # A low temperature, like 0.1, makes the model's choices more predictable and focused, selecting the most probable tokens.
            # This leads to less creative and more deterministic responses.
            #https://cloud.google.com/vertex-ai/generative-ai/docs/learn/prompts/adjust-parameter-values


    response = requests.post(
        f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
        json={
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.1, #Google Gemini Values and stats Controls Randomness lower means less random
                "topK": 1, #  how probable
                "topP": 1, # Determines how creative or randomizes it by seed
                "maxOutputTokens": 2048, #Max singular output should be fine "A token is approximately four characters."
            }
        },
        timeout=10 # Waits 10 seconds
    )

    if response.status_code != 200:
        return {'original': text, 'corrected': text, 'success': False}

    result = response.json()
    corrected_text = result['candidates'][0]['content']['parts'][0]['text'].strip()

    # removal of unnecessary items
    corrected_text = corrected_text.strip('"\'`')
    if '```' in corrected_text:
        corrected_text = corrected_text.replace('```', '')

    differences = find_differences(text, corrected_text)

    return {
        'original': text,
        'corrected': corrected_text,
        'differences': differences,
        'num_corrections': len(differences),
        'success': True,
        'model': 'gemini-2.0-flash'#lightweight and cheapest
    }

def spell_correction_standard(text : str = "", language : str = 'en') -> Dict[str, Any]:
    VENNIFY_MAX_LENGTH = 512

    model, tokenizer = get_model(language)

    prefix = "grammar: " if language == 'en' else "correct: "
    input_text = prefix + text

    inputs = tokenizer(
        input_text,
        return_tensors='pt',  # pytorch acronym
        max_length=VENNIFY_MAX_LENGTH,  # max 512 Lmspell
        truncation=True  # Cut off if too long
    )

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_length=VENNIFY_MAX_LENGTH,  # max 512 Lmspell
            num_beams=5,
            early_stopping=True,
            no_repeat_ngram_size=3
        )  # resource used for both sections https://huggingface.co/docs/transformers/main/en/main_classes/text_generation

    corrected_text = tokenizer.decode(outputs[0], skip_special_tokens=True).strip()

    # Fallback
    if not corrected_text:
        corrected_text = text

    differences = find_differences(text, corrected_text)

    return {
        'original': text,
        'corrected': corrected_text,
        'differences': differences,
        'num_corrections': len(differences),
        'success': True,
        'model': f'local_{language}',
        'language': language
    }

def spell_correction(text: str, language: str = 'en', premium: bool = False) -> Dict[str, Any]:

    text = ' '.join(text.strip().split())

    if not text:
        return {'original': '', 'corrected': '', 'success': False}

    if len(text) > 1024:#limit from lmspell
        return {'original': text, 'corrected': text, 'success': False}

    if premium:
        print("MODEL", "Using Gemini")
        return spell_correction_gemini(text=text)
    else:
        print("MODEL", "Standard")
        return spell_correction_standard(text=text, language=language)






def find_differences(original, corrected):#nothing here changed
    if original == corrected:
        return []

    original_words = original.split()
    corrected_words = corrected.split()
    differences = []
    matcher = SequenceMatcher(None, original_words, corrected_words)

    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == 'replace':
            differences.append({
                'type': 'replacement',
                'original': ' '.join(original_words[i1:i2]),
                'corrected': ' '.join(corrected_words[j1:j2]),
                'original_index': i1,
                'corrected_index': j1
            })
        elif tag == 'delete':
            differences.append({
                'type': 'deletion',
                'original': ' '.join(original_words[i1:i2]),
                'corrected': '',
                'original_index': i1,
                'corrected_index': j1
            })
        elif tag == 'insert':
            differences.append({
                'type': 'insertion',
                'original': '',
                'corrected': ' '.join(corrected_words[j1:j2]),
                'original_index': i1,
                'corrected_index': j1
            })

    return differences


def is_model_loaded(language='en'):
    return _models.get(language) is not None and _tokenizers.get(language) is not None


def unload_model(language=None):
    global _models, _tokenizers

    if language:
        _models[language] = None
        _tokenizers[language] = None
    else:
        for lang in _models:
            _models[lang] = None
            _tokenizers[lang] = None


def quick_test():
    """
      Added Gemmini API testing
      Run it in terminal:
      python manage.py shell
      from api import lmspell
      lmspell.quick_test()
      """

    test_texts = [
        "The quik brown foks jump over teh lazi dog.",
        "She sells seechells bye the seashor.",
        "I am goign to the supermarkit later tooday."
    ]
    print("\nQuick Test Results:")


    print("Vennify local : ")
    print("\n" + "=" * 50)
    for text in test_texts:
        result = spell_correction(text=text, premium=False)
        print("\n" + "=" * 50)
        print(f"Original:  {text}")
        print(f"Corrected {result['corrected']}\n")
        print("=" * 50)
    if GEMINI_API_KEY:
        print("\nGEMINI API TEST:")
        result = spell_correction(text="The quik brown foks jump over teh lazi dog.", premium=True)     # This is the sentence that is displayed not the other one
        if result['success']:
            print(f"Original: The quik brown foks jump over teh lazi dog.")
            print(f"Corrected {result['corrected']}")

    print("=" * 50)


if __name__ == "__main__":
    quick_test()
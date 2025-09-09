import torch
from transformers import T5ForConditionalGeneration, T5TokenizerFast
from difflib import SequenceMatcher # Compares Sequences: Used to compare the original vs corrected words
import logging

logger = logging.getLogger(__name__)

# Global model storage
_model = None
_tokenizer = None


def get_model():
    """English correction model"""
    global _model, _tokenizer

    if _model is None:
        print("Loading Correction Model...")

        model_name = "vennify/t5-base-grammar-correction"#other models seems to be only for Sinhala

        _model = T5ForConditionalGeneration.from_pretrained(
            model_name,
            cache_dir="./model_cache"
        )
        _tokenizer = T5TokenizerFast.from_pretrained(
            model_name,
            cache_dir="./model_cache"
        )

        _model.eval()
        print("Model loaded successfully!")

    return _model, _tokenizer


def correct_text(text, max_length=512): # "was trained on sequences of up to 512 tokens."stack

    # Clean and validate input
    text = ' '.join(text.strip().split())#removes white space
    if not text:
        return {'original': '', 'corrected': '', 'error': 'Empty input'}

    if len(text) > 1024:
        return {'original': text, 'corrected': text, 'error': 'Text too long '}

    try:
        model, tokenizer = get_model()

        # Prepare input with prefix
        input_text = f"grammar: {text}"

        inputs = tokenizer(
            input_text,
            return_tensors='pt',
            max_length=max_length,
            truncation=True
        )

        # Generate correction
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_length=max_length,
                num_beams=5,
                early_stopping=True,
                no_repeat_ngram_size=3
            )

        corrected_text = tokenizer.decode(
            outputs[0],
            skip_special_tokens=True
        ).strip()

        # Fallback to original if empty
        if not corrected_text:
            corrected_text = text

        differences = find_differences(text, corrected_text)

        return {
            'original': text,
            'corrected': corrected_text,
            #COLE IS REMOVING THE DUPLICATION
            #'correctText': corrected_text,  # Frontend
            #'incorrectText': text,  # Frontend
            'differences': differences,
            'num_corrections': len(differences),
            'success': True
        }

    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return {
            'original': text,
            'corrected': text,
            'error': str(e),
            'success': False
        }


def find_differences(original, corrected):

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

def is_model_loaded():
    return _model is not None and _tokenizer is not None


def unload_model():
    """Free up memory by unloading model"""
    global _model, _tokenizer
    _model = None
    _tokenizer = None
    print("Model unloaded")


def quick_test():
    """
    Quick test function
    run it in terminal
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
    print("=" * 50) # repeats 50 times

    for text in test_texts:
        result = correct_text(text)
        print(f"Original:  {text}")
        print(f"Corrected: {result['corrected']}")
        print("-" * 30)

    print("=" * 50)


if __name__ == "__main__":
    quick_test()
"""
First attempt at adding LMSpell. Still needs fixing
"""

import torch
import re
from transformers import MT5ForConditionalGeneration, T5TokenizerFast
import os
import logging


logger = logging.getLogger(__name__)

# variables to store model
_model = None
_tokenizer = None


def get_model():
    """Loads the model """
    global _model, _tokenizer

    if _model is None:
        try:
            print("Loading LMSpell model(found it takes ages)")

            # Get Hugging Face token from .env Cole's Key
            hf_token = os.environ.get("HF_TOKEN")

            if not hf_token:
                print("Warning: HF_TOKEN not set.")

            # Loading the model
            _model = MT5ForConditionalGeneration.from_pretrained(
                "lm-spell/mt5-base-ft-ssc",
                token=hf_token,
                cache_dir="./model_cache"  # Cache locally
            )
            _model.eval()

            # Load tokenizer
            _tokenizer = T5TokenizerFast.from_pretrained(
                "google/mt5-base",
                cache_dir="./model_cache"
            )
            _tokenizer.add_special_tokens({'additional_special_tokens': ['<ZWJ>']})

            logger.info("Model loaded")
            print("Model loaded")

        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            print(f"Error loading model: {str(e)}")
            raise

    return _model, _tokenizer


def correct_text(text, max_length=512):

    try:
        # Validate input
        if not text or not isinstance(text, str):
            return {
                'original': text,
                'corrected': text,
                'error': 'Invalid input text'
            }

        if len(text) > 5000:  # limit
            return {
                'original': text,
                'corrected': text,
                'error': 'Text too long. Please limit to 5000 characters.'
            }

        model, tokenizer = get_model()

        # Replace zero-width joiner
        processed_text = re.sub(r'\u200d', '<ZWJ>', text)

        # Tokenize
        try:
            inputs = tokenizer(
                processed_text,
                return_tensors='pt',
                padding='do_not_pad',
                max_length=max_length
            )
        except Exception as e:
            logger.error(f"Tokenization error: {str(e)}")
            return {
                'original': text,
                'corrected': text,
                'error': f'Tokenization error: {str(e)}'
            }

        # Generate corrections
        with torch.inference_mode():
            try:
                outputs = model.generate(
                    input_ids=inputs["input_ids"],
                    attention_mask=inputs["attention_mask"],
                    max_length=max_length,
                    num_beams=2,  # Slightly increase beams for better quality
                    do_sample=False,
                    early_stopping=True,
                    no_repeat_ngram_size=3  # Prevent repetition
                )
            except Exception as e:
                logger.error(f"Generation error: {str(e)}")
                return {
                    'original': text,
                    'corrected': text,
                    'error': f'Generation error: {str(e)}'
                }

        # Decode the output
        try:
            prediction = outputs[0]
            special_token_id_to_keep = tokenizer.convert_tokens_to_ids('<ZWJ>')
            all_special_ids = set(tokenizer.all_special_ids)

            pred_tokens = prediction.cpu()
            tokens_list = pred_tokens.tolist()

            # Filter special tokens except ZWJ
            filtered_tokens = [
                token for token in tokens_list
                if token == special_token_id_to_keep or token not in all_special_ids
            ]

            prediction_decoded = tokenizer.decode(
                filtered_tokens,
                skip_special_tokens=False,
                clean_up_tokenization_spaces=True
            ).replace('\n', '').strip()

            # Replace special token back
            corrected = re.sub(r'<ZWJ>\s?', '\u200d', prediction_decoded)

            # Find differences for highlighting
            differences = find_differences(text, corrected)

            return {
                'original': text,
                'corrected': corrected,
                'differences': differences,
                'success': True
            }

        except Exception as e:
            logger.error(f"Decoding error: {str(e)}")
            return {
                'original': text,
                'corrected': text,
                'error': f'Decoding error: {str(e)}'
            }

    except Exception as e:
        logger.error(f"Unexpected error in correct_text: {str(e)}")
        return {
            'original': text,
            'corrected': text,
            'error': f'Unexpected error: {str(e)}'
        }


def find_differences(original, corrected):
    """
    Find the differences between original and corrected text

    Returns:
        List of dictionaries containing difference information
    """
    differences = []

    # Simple word word comparison
    original_words = original.split()
    corrected_words = corrected.split()

    from difflib import SequenceMatcher

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


def batch_correct_texts(texts, batch_size=8):
    """
    Correct multiple texts in batches
    texts: List of texts to correct
    batch_size: Number of texts to process at once

    Returns:
        List of correction results
    """
    results = []

    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        for text in batch:
            result = correct_text(text)
            results.append(result)

    return results


def is_model_loaded():
    return _model is not None and _tokenizer is not None


def unload_model():
    global _model, _tokenizer
    _model = None
    _tokenizer = None

    logger.info("Model unloaded from memory")
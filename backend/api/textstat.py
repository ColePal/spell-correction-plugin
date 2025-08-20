import re
import warnings
from pathlib import Path
from importlib import resources
from .cmudict import cmudict
from .pyphen import Pyphen

def flesch_reading_ease(text: str, language: str) -> float:
    return round(flesch_reading_ease_raw(text, language))

def flesch_reading_ease_raw(text, lang):
    (lang_root) = get_lang_root(lang)
    sentence_length = words_per_sentence(text)
    syllables = syllables_per_word(text, lang)
    if sentence_length == 0 or syllables == 0:
        return 0.0
    return (get_lang_cfg(lang_root, "fre_base")- get_lang_cfg(lang_root, "fre_sentence_length") * sentence_length- get_lang_cfg(lang_root, "fre_syll_per_word") * syllables)

def get_lang_cfg(lang: str, key: str) -> float:
    lang_root = get_lang_root(lang)
    default_config = LANG_CONFIGS["en"]
    config = LANG_CONFIGS.get(lang_root, default_config)
    val = config.get(key)
    if val is None:
        raise ValueError(f"Unknown config key {key}")
    return val

def get_lang_root(lang: str) -> str:
    if "_" in lang:
        return lang.split("_")[0]
    return lang

def words_per_sentence(text: str) -> float:
    try:
        return count_words(text) / count_sentences(text)
    except ZeroDivisionError:
        return 0.0

def syllables_per_word(text: str, lang: str) -> float:
    try:
        return count_syllables(text, lang) / count_words(text)
    except ZeroDivisionError:
        return 0.0

def count_words(
    text: str,
    rm_punctuation: bool = True,
    split_contractions: bool = False,
    split_hyphens: bool = False,
) -> int:
    return len(
        list_words(
            text,
            rm_punctuation=rm_punctuation,
            split_contractions=split_contractions,
            split_hyphens=split_hyphens,
        )
    )

def count_sentences(text: str) -> int:
    if len(text) == 0:
        return 0

    ignore_count = 0
    sentences = re.findall(r"\b[^.!?]+[.!?]*", text, re.UNICODE)
    for sentence in sentences:
        if count_words(sentence) <= 2:
            ignore_count += 1
    return max(1, len(sentences) - ignore_count)

def count_syllables(text: str, lang: str) -> int:
    if not text:
        return 0
    cmu_dict = get_cmudict(lang)
    pyphen = get_pyphen(lang)
    count = 0
    for word in list_words(text, lowercase=True):
        try:
            cmu_phones = cmu_dict[word][0]
            count += sum(1 for p in cmu_phones if p[-1].isdigit())
        except (TypeError, IndexError, KeyError):
            count += len(pyphen.positions(word)) + 1
    return count

def get_cmudict(lang: str) -> dict[str, list[list[str]]] | None:
    if get_lang_root(lang) == "en":
        return cmudict()
    else:
        return None

def get_pyphen(lang: str) -> Pyphen:
    return Pyphen(lang=lang)

def list_words(
    text: str,
    rm_punctuation: bool = True,
    rm_apostrophe: bool = False,
    lowercase: bool = False,
    split_contractions: bool = False,
    split_hyphens: bool = False,
) -> list[str]:
    if split_hyphens:
        text = re.sub(r"-", " ", text)
    if rm_punctuation:
        text = remove_punctuation(text, rm_apostrophe=rm_apostrophe)
    if lowercase:
        text = text.lower()
    if split_contractions:
        text = re.sub(RE_CONTRACTION_APOSTROPHE, " ", text)
    return text.split()

import typing

if typing.TYPE_CHECKING:
    import sys

    if sys.version_info < (3, 10):
        from typing_extensions import ParamSpec, TypeVar
    else:
        from typing import ParamSpec, TypeVar

    P = ParamSpec("P")
    T = TypeVar("T")

LANG_CONFIGS: dict[str, dict[str, float]] = {
    "en": {  # Default config
        "fre_base": 206.835,
        "fre_sentence_length": 1.015,
        "fre_syll_per_word": 84.6,
        "syllable_threshold": 3,
    },
    "de": {
        # Toni Amstad
        "fre_base": 180,
        "fre_sentence_length": 1,
        "fre_syll_per_word": 58.5,
    },
    "es": {
        # Fernandez Huerta Readability Formula
        "fre_base": 206.84,
        "fre_sentence_length": 1.02,
        "fre_syll_per_word": 60.0,
    },
    "fr": {
        "fre_base": 207,
        "fre_sentence_length": 1.015,
        "fre_syll_per_word": 73.6,
    },
    "it": {
        # Flesch-Vacca
        "fre_base": 217,
        "fre_sentence_length": 1.3,
        "fre_syll_per_word": 60.0,
    },
    "nl": {
        # Flesch-Douma
        "fre_base": 206.835,
        "fre_sentence_length": 0.93,
        "fre_syll_per_word": 77,
    },
    "pl": {
        "syllable_threshold": 4,
    },
    "ru": {
        "fre_base": 206.835,
        "fre_sentence_length": 1.3,
        "fre_syll_per_word": 60.1,
    },
    "hu": {
        "fre_base": 206.835,
        "fre_sentence_length": 1.015,
        "fre_syll_per_word": 58.5,
        "syllable_threshold": 5,
    },
}

RE_CONTRACTION_ENDINGS = r"[tsd]|ve|ll|re"
RE_CONTRACTION_APOSTROPHE = r"\'(?=" + RE_CONTRACTION_ENDINGS + ")"
RE_NONCONTRACTION_APOSTROPHE = r"\'(?!" + RE_CONTRACTION_ENDINGS + ")"

CACHE_SIZE = 128

def remove_punctuation(
    text: str,
    rm_apostrophe: bool,
) -> str:
    if rm_apostrophe:
        # remove all punctuation
        punctuation_regex = r"[^\w\s]"
    else:
        # remove non-apostrophe single quotation marks
        text = re.sub(RE_NONCONTRACTION_APOSTROPHE, "", text)
        # remove all punctuation except apostrophes
        punctuation_regex = r"[^\w\s\']"

    text = re.sub(punctuation_regex, "", text)
    return text


def flesch_kincaid_grade(text, language):
    return round(flesch_reading_ease_raw(text, language))

def flesch_kincaid_grade_raw(text : str, language : str) -> float:
        sentence_length = words_per_sentence(text)
        syllables = syllables_per_word(text, language)

        if sentence_length == 0 or syllables == 0:
            return 0.0

        return (0.39 * sentence_length) + (11.8 * syllables) - 15.59

def gunning_fog(text, language):
    return round(gunning_fog_raw(text, language))

def gunning_fog_raw(text: str, lang: str) -> float:
    syllable_threshold = int(get_lang_cfg(lang, "syllable_threshold"))
    diff_words = count_difficult_words(text, lang, syllable_threshold)
    tot_words = count_words(text)

    try:
        per_diff_words = 100 * diff_words / tot_words
    except ZeroDivisionError:
        return 0.0

    return 0.4 * (words_per_sentence(text) + per_diff_words)

def count_difficult_words(
    text: str, lang: str, syllable_threshold: int = 2, unique: bool = False
) -> int:
    if unique:
        return len(set_difficult_words(text, syllable_threshold, lang))
    return len(list_difficult_words(text, syllable_threshold, lang))

def list_difficult_words(text: str, syllable_threshold: int, lang: str) -> list[str]:
    words = list_words(text)
    diff_words = [
        word for word in words if is_difficult_word(word, syllable_threshold, lang)
    ]
    return diff_words

def set_difficult_words(text: str, syllable_threshold: int, lang: str) -> set[str]:
    return set(list_difficult_words(text, syllable_threshold, lang))

def is_difficult_word(word: str, syllable_threshold: int, lang: str) -> bool:
    # Not a word
    if len(word.split()) != 1:
        return False

    easy_word_set = get_lang_easy_words(lang)

    # easy set is all lowercase
    word = word.lower()

    # Not hard
    if word in easy_word_set:
        return False

    # Too short
    if count_syllables(word, lang) < syllable_threshold:
        return False

    return True

def get_lang_easy_words(lang: str) -> set[str]:
    lang_root = get_lang_root(lang)
    try:
        return _set_words(lang_root)
    except FileNotFoundError:
        warnings.warn(
            f"There is no easy words vocabulary for {lang_root}, using english.",
            Warning,
        )
        return _set_words("en")

def _set_words(lang_root: str) -> set[str]:
    lang = lang_root
    path = Path(__file__).parent / 'language_resources' / lang / 'easy_words.txt'
    with open(path, "r", encoding="utf-8") as file:
        words = set([ln.strip() for ln in file])
    return words
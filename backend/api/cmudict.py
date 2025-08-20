from typing import IO, Dict, Optional
from importlib import resources
import re

CMUDICT_DICT = "language_resources/cmudict.dict"

def cmudict() -> Dict[str, list[list[str]]]:
    default: Dict[str, list[list[str]]] = {}
    for key, value in entries():
        if key not in default:
            default[key] = []
        default[key].append(value)
    return default

def _stream(resource_name: str) -> IO[bytes]:
    stream: IO[bytes] = resources.files(__name__).joinpath(resource_name).open("rb")
    return stream

def entries() -> list[tuple[str, list[str]]]:
    with dict_stream() as stream:
        cmu_entries: list[tuple[str, list[str]]] = _entries(stream, "#")
    return cmu_entries

def dict_stream() -> IO[bytes]:
    """Return a readable file-like object of the cmudict.dict file."""
    stream: IO[bytes] = _stream(CMUDICT_DICT)
    return stream

def _entries(
    stream: IO[bytes], comment_string: Optional[str] = None
) -> list[tuple[str, list[str]]]:
    cmudict_entries = []
    for line in stream:
        parts = []
        if comment_string:
            parts = line.decode("utf-8").strip().split(comment_string)[0].split()
        else:
            parts = line.decode("utf-8").strip().split()
        thing = re.sub(r"\(\d+\)$", "", parts[0])
        cmudict_entries.append((thing, parts[1:]))
    return cmudict_entries
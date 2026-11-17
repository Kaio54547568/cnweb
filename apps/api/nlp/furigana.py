"""Single-process JSON Lines adapter for the subtitle worker."""
import json
import re
import sys

from sudachipy import Dictionary, SplitMode

KANJI = re.compile(r"[\u3400-\u4dbf\u4e00-\u9fff\U00020000-\U000323af々]")
TO_HIRAGANA = str.maketrans(
    {code: code - 0x60 for code in range(0x30A1, 0x30F7)}
)


def segments(surface, reading):
    if not reading or not KANJI.search(surface):
        return [[surface, None]]

    runs = re.findall(r"[\u3400-\u4dbf\u4e00-\u9fff\U00020000-\U000323af々]+|.", surface, re.DOTALL)
    pattern = "".join(
        "(.+?)" if KANJI.match(run) else "(" + re.escape(run.translate(TO_HIRAGANA)) + ")"
        for run in runs
    )
    matched = re.fullmatch(pattern, reading)
    if not matched:
        return [[surface, reading]]
    return [
        [run, kana if KANJI.match(run) else None]
        for run, kana in zip(runs, matched.groups())
    ]


def tokenize(tokenizer, text):
    result = []
    offset = 0
    attach_auxiliary = False
    for token in tokenizer.tokenize(text, SplitMode.C):
        start, end = token.begin(), token.end()
        if start < offset or end <= start:
            continue
        if start > offset:
            gap = text[offset:start]
            result.append(dict(surface=gap, lemma=None, reading=None, ruby=[[gap, None]]))
            attach_auxiliary = False
        surface = text[start:end]
        reading = "" if token.is_oov() else token.reading_form().translate(TO_HIRAGANA)
        pos = token.part_of_speech()[0]
        ruby = segments(surface, reading)
        if attach_auxiliary and pos == "助動詞":
            previous = result[-1]
            previous["surface"] += surface
            previous["reading"] = ((previous["reading"] or "") + reading) or None
            previous["ruby"].extend(ruby)
        else:
            lemma = (surface if token.is_oov() else token.dictionary_form()) if any(
                ch.isalnum() for ch in surface
            ) else None
            result.append(dict(surface=surface, lemma=lemma, reading=reading or None, ruby=ruby))
            attach_auxiliary = lemma is not None and pos in {"動詞", "形容詞"}
        offset = end
    if offset < len(text):
        gap = text[offset:]
        result.append(dict(surface=gap, lemma=None, reading=None, ruby=[[gap, None]]))
    return result


def main():
    sys.stdin.reconfigure(encoding="utf-8")
    sys.stdout.reconfigure(encoding="utf-8")
    tokenizer = Dictionary().create()
    print('{"ready":true}', flush=True)
    for line in sys.stdin:
        request = json.loads(line)
        try:
            words = [tokenize(tokenizer, text) for text in request["texts"]]
            result = {"id": request["id"], "words": words}
        except Exception as error:
            print(type(error).__name__, file=sys.stderr, flush=True)
            result = {"id": request["id"], "error": True}
        print(json.dumps(result, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()

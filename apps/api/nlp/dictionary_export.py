"""Convert trusted EDRDG JMdict/KANJIDIC2 XML(.gz) to streaming JSON Lines."""
import argparse
import gzip
import json
import sys
import unicodedata
import xml.etree.ElementTree as ET

XML_LANG = "{http://www.w3.org/XML/1998/namespace}lang"
LANGUAGES = {"en": "en", "eng": "en", "vi": "vi", "vie": "vi"}


def distinct(values):
    return list(dict.fromkeys(value.strip() for value in values if value and value.strip()))


def meanings(nodes, attr):
    return [
        {"lang": language, "text": node.text.strip()}
        for node in nodes
        if (language := LANGUAGES.get(node.get(attr, "en"))) and node.text and node.text.strip()
    ]


def word(node):
    number = node.findtext("ent_seq")
    forms = distinct(element.text for element in node.findall("k_ele/keb"))
    readings = distinct(element.text for element in node.findall("r_ele/reb"))
    if not number or not number.isascii() or not number.isdecimal() or not (forms or readings):
        return None
    return {"id": "jmdict:" + number, "headword": (forms or readings)[0],
            "readings": readings, "terms": forms + readings,
            "glosses": meanings(node.findall("sense/gloss"), XML_LANG)}


def kanji(node):
    literal = node.findtext("literal")
    if not literal or len(literal) != 1:
        return None
    readings = distinct(r.text for r in node.findall("reading_meaning/rmgroup/reading")
                        if r.get("r_type") in {"ja_on", "ja_kun"})
    return {"id": f"kanji:{ord(literal):04x}", "headword": literal,
            "readings": readings, "terms": [literal],
            "glosses": meanings(node.findall("reading_meaning/rmgroup/meaning"), "m_lang")}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("kind", choices=["jmdict", "kanjidic"])
    parser.add_argument("file", help="Official EDRDG XML file, optionally gzip-compressed")
    args = parser.parse_args()
    opener = gzip.open if args.file.lower().endswith(".gz") else open
    root_tag, entry_tag, convert = (("JMdict", "entry", word) if args.kind == "jmdict"
                                    else ("kanjidic2", "character", kanji))
    sys.stdout.reconfigure(encoding="utf-8")
    with opener(args.file, "rb") as stream:
        events = iter(ET.iterparse(stream, events=("start", "end")))
        _, root = next(events)
        if root.tag != root_tag:
            raise ValueError(f"Expected XML root {root_tag}")
        for event, element in events:
            if event == "end" and element.tag == entry_tag:
                entry = convert(element)
                if entry:
                    entry["terms"] = distinct(unicodedata.normalize("NFKC", term) for term in entry["terms"])
                    print(json.dumps(entry, ensure_ascii=False))
                root.remove(element)


if __name__ == "__main__":
    main()

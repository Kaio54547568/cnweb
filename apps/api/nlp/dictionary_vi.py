"""Validate and export the reviewed Vietnamese dictionary overlay."""
import csv
import json
import re
import sys


def read(path):
    rows = []
    seen = {}
    with open(path, encoding="utf-8-sig", newline="") as file:
        reader = csv.reader(file, strict=True)
        if next(reader, None) != ["entryId", "meaningVi", "source"]:
            raise ValueError("CSV header must be entryId,meaningVi,source")
        for cells in reader:
            line = reader.line_num
            if not cells:
                continue
            if len(cells) != 3 or any(not cell.strip() or "\0" in cell for cell in cells):
                raise ValueError(f"Line {line}: expected three non-empty fields")
            entry_id, meaning, source = (cell.strip() for cell in cells)
            if not re.fullmatch(r"jmdict:[0-9]{1,12}|kanji:[a-f0-9]{4,6}", entry_id):
                raise ValueError(f"Line {line}: invalid entryId")
            if entry_id in seen:
                raise ValueError(f"Line {line}: duplicate entryId {entry_id} (line {seen[entry_id]})")
            seen[entry_id] = line
            rows.append(dict(entry_id=entry_id, meaning_vi=meaning, source=source, line=line))
    if not rows:
        raise ValueError("CSV contains no entries")
    return rows


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    try:
        print(json.dumps(read(sys.argv[1]), ensure_ascii=False))
    except (ValueError, csv.Error, OSError) as error:
        sys.exit(str(error))

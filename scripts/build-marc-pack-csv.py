#!/usr/bin/env python3
"""Write the packaged Marc-format CSV from the table question library."""

import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "src/data/questions.json"
DEST = ROOT / "public/Tap_Trivia_Question_Database.csv"


def as_difficulty(value: str) -> str:
    key = (value or "").strip().lower()
    if key == "smart":
        return "hard"
    if key in {"easy", "medium", "hard"}:
        return key
    return "medium"


def detect_type(answer: str, options: list[str]) -> str:
    if answer.strip().lower() in {"true", "false"}:
        return "boolean"
    if len(options) == 4:
        return "multiple"
    return "open"


def main() -> None:
    questions = json.loads(SOURCE.read_text())
    DEST.parent.mkdir(parents=True, exist_ok=True)
    with DEST.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                "question_id",
                "difficulty",
                "assigned_category",
                "question",
                "answers",
                "type",
                "option_a",
                "option_b",
                "option_c",
                "option_d",
                "source",
            ],
        )
        writer.writeheader()
        seen: set[str] = set()
        written = 0
        for index, item in enumerate(questions):
            question = str(item.get("question") or "").strip()
            answer = str(item.get("answer") or "").strip()
            if not question or not answer:
                continue
            key = question.lower()
            if key in seen:
                continue
            seen.add(key)
            distractors = []
            used = {answer.lower()}
            for raw in item.get("distractors") or []:
                text = str(raw or "").strip()
                if not text or text.lower() in used:
                    continue
                used.add(text.lower())
                distractors.append(text)
                if len(distractors) == 3:
                    break
            options = [answer, *distractors] if len(distractors) == 3 else []
            kind = detect_type(answer, options)
            writer.writerow(
                {
                    "question_id": f"marc-pack-{index + 1}",
                    "difficulty": as_difficulty(str(item.get("difficulty") or "")),
                    "assigned_category": str(item.get("category") or "General Knowledge").strip()
                    or "General Knowledge",
                    "question": question,
                    "answers": answer,
                    "type": kind,
                    "option_a": options[0] if options else "",
                    "option_b": options[1] if len(options) > 1 else "",
                    "option_c": options[2] if len(options) > 2 else "",
                    "option_d": options[3] if len(options) > 3 else "",
                    "source": "Tap Trivia packaged Marc pack",
                }
            )
            written += 1
    print(f"Wrote {written} questions to {DEST}")


if __name__ == "__main__":
    main()

from __future__ import annotations

import calendar
import html
import io
import re
from dataclasses import dataclass
from typing import Any
from zipfile import BadZipFile

from docx import Document
from docx.opc.exceptions import PackageNotFoundError
from rapidfuzz import fuzz

from .files import CourseFileError, _display_value, _read_tabular_rows, _select_header_row

MIN_MATCH_SCORE = 88.0
MIN_TOKEN_COVERAGE = 70.0
MIN_MATCH_GAP = 8.0

_TITLE_ALIASES = {"title": ("title", "titlu", "nume curs")}
_TITLE_REQUIRED = ("title",)
_MONTH_COLUMN_ORDER = [calendar.month_name[index].casefold() for index in range(1, 13)]

_DIACRITICS_TABLE = str.maketrans(
    {"ă": "a", "â": "a", "î": "i", "ș": "s", "ş": "s", "ț": "t", "ţ": "t"}
)
_NON_WORD_RE = re.compile(r"[^\w\s]")
_WHITESPACE_RE = re.compile(r"\s+")
_STANDARD_CODE_RE = re.compile(r"\b\d{4,5}\b")


@dataclass(frozen=True)
class ScheduleRow:
    row_index: int
    title: str
    normalized_title: str
    dates: tuple[str, str, str]


@dataclass(frozen=True)
class WordRow:
    row: Any
    title: str
    normalized_title: str


@dataclass(frozen=True)
class ScoredMatch:
    entry: ScheduleRow
    score: float
    word_coverage: float
    schedule_coverage: float
    exact: bool


def normalize_title(value: str) -> str:
    normalized = html.unescape(str(value or "")).replace("\xa0", " ").strip().casefold()
    normalized = normalized.translate(_DIACRITICS_TABLE)
    normalized = _NON_WORD_RE.sub(" ", normalized)
    return _WHITESPACE_RE.sub(" ", normalized).strip()


def parse_schedule_file(data: bytes, extension: str) -> list[ScheduleRow]:
    rows = _read_tabular_rows(data, extension, _TITLE_ALIASES, _TITLE_REQUIRED)
    header_row_index, headers = _select_header_row(rows, _TITLE_ALIASES, _TITLE_REQUIRED)

    title_index = next(
        (headers[alias] for alias in _TITLE_ALIASES["title"] if alias in headers),
        None,
    )
    if title_index is None:
        raise CourseFileError('Coloana obligatorie „title” lipsește.')

    month_indexes = [headers[month] for month in _MONTH_COLUMN_ORDER if month in headers]
    if not month_indexes:
        raise CourseFileError(
            "Fișierul cu programul cursurilor nu conține coloane de lună "
            "(January-December)."
        )

    schedule_rows: list[ScheduleRow] = []
    for row_index, row in enumerate(rows[header_row_index + 1 :]):

        def cell(index: int) -> Any:
            return row[index] if index < len(row) else None

        title = _display_value(cell(title_index))
        if not title:
            continue

        dates: list[str] = []
        for month_index in month_indexes:
            value = _display_value(cell(month_index))
            if value:
                dates.append(value)
            if len(dates) == 3:
                break
        while len(dates) < 3:
            dates.append("")

        schedule_rows.append(
            ScheduleRow(
                row_index=row_index,
                title=title,
                normalized_title=normalize_title(title),
                dates=(dates[0], dates[1], dates[2]),
            )
        )

    if not schedule_rows:
        raise CourseFileError("Fișierul cu programul cursurilor nu conține rânduri valide.")

    return schedule_rows


def _open_word_document(data: bytes) -> Document:
    try:
        return Document(io.BytesIO(data))
    except (BadZipFile, PackageNotFoundError, KeyError, OSError, ValueError) as exc:
        raise CourseFileError("Fișierul Word încărcat nu poate fi citit.") from exc


def build_word_course_rows(document: Document) -> list[WordRow]:
    rows: list[WordRow] = []
    for table in document.tables:
        for row in table.rows:
            cells = row.cells
            if len(cells) < 6:
                continue
            first_cell = cells[0]
            if first_cell._tc in {cell._tc for cell in cells[1:]}:
                continue
            title = first_cell.text.strip()
            if not title or sum(1 for cell in cells if cell.text.strip()) <= 1:
                continue
            rows.append(WordRow(row=row, title=title, normalized_title=normalize_title(title)))
    return rows


def _token_coverage(source: str, target: str) -> float:
    source_tokens = set(source.split())
    target_tokens = set(target.split())
    if not source_tokens:
        return 0.0
    return len(source_tokens & target_tokens) / len(source_tokens) * 100


def _combined_title_score(word_normalized: str, schedule_normalized: str) -> float:
    return (
        0.35 * fuzz.WRatio(word_normalized, schedule_normalized)
        + 0.25 * fuzz.token_sort_ratio(word_normalized, schedule_normalized)
        + 0.20 * _token_coverage(word_normalized, schedule_normalized)
        + 0.20 * _token_coverage(schedule_normalized, word_normalized)
    )


def _standard_code_tokens(value: str) -> set[str]:
    return set(_STANDARD_CODE_RE.findall(value))


def score_schedule_matches(
    word_title: str,
    schedule_rows: list[ScheduleRow],
) -> list[ScoredMatch]:
    word_normalized = normalize_title(word_title)
    if not word_normalized or not schedule_rows:
        return []

    exact_matches = [entry for entry in schedule_rows if entry.normalized_title == word_normalized]
    if len(exact_matches) == 1:
        return [
            ScoredMatch(
                entry=exact_matches[0],
                score=100.0,
                word_coverage=100.0,
                schedule_coverage=100.0,
                exact=True,
            )
        ]

    scored: list[ScoredMatch] = []
    for entry in schedule_rows:
        schedule_normalized = entry.normalized_title
        scored.append(
            ScoredMatch(
                entry=entry,
                score=_combined_title_score(word_normalized, schedule_normalized),
                word_coverage=_token_coverage(word_normalized, schedule_normalized),
                schedule_coverage=_token_coverage(schedule_normalized, word_normalized),
                exact=False,
            )
        )
    scored.sort(key=lambda item: item.score, reverse=True)
    return scored


def confident_match(
    word_title: str,
    scored_matches: list[ScoredMatch],
    *,
    min_match_score: float = MIN_MATCH_SCORE,
    min_token_coverage: float = MIN_TOKEN_COVERAGE,
    min_match_gap: float = MIN_MATCH_GAP,
) -> ScheduleRow | None:
    if not scored_matches:
        return None
    if scored_matches[0].exact:
        return scored_matches[0].entry

    word_normalized = normalize_title(word_title)
    best = scored_matches[0]
    second = scored_matches[1] if len(scored_matches) > 1 else None

    if (
        best.score < min_match_score
        or best.word_coverage < min_token_coverage
        or best.schedule_coverage < min_token_coverage
    ):
        word_codes = _standard_code_tokens(word_normalized)
        best_codes = _standard_code_tokens(best.entry.normalized_title)
        second_codes = _standard_code_tokens(second.entry.normalized_title) if second else set()
        if not (
            word_codes
            and word_codes.issubset(best_codes)
            and not word_codes.issubset(second_codes)
            and best.score >= 70
            and best.word_coverage >= 60
        ):
            return None

    if second and best.score - second.score < min_match_gap:
        word_codes = _standard_code_tokens(word_normalized)
        best_codes = _standard_code_tokens(best.entry.normalized_title)
        second_codes = _standard_code_tokens(second.entry.normalized_title)
        if not (
            word_codes
            and word_codes.issubset(best_codes)
            and not word_codes.issubset(second_codes)
            and best.word_coverage >= 60
        ):
            return None

    return best.entry


def candidate_payload(scored_match: ScoredMatch) -> dict[str, Any]:
    entry = scored_match.entry
    return {
        "row_index": entry.row_index,
        "title": entry.title,
        "dates": list(entry.dates),
        "score": round(scored_match.score, 1),
        "word_coverage": round(scored_match.word_coverage, 1),
        "schedule_coverage": round(scored_match.schedule_coverage, 1),
        "exact": scored_match.exact,
    }


def build_word_match_preview(
    word_file_bytes: bytes,
    schedule_rows: list[ScheduleRow],
) -> dict[str, Any]:
    word_rows = build_word_course_rows(_open_word_document(word_file_bytes))
    rows: list[dict[str, Any]] = []
    matched_count = 0
    skipped_count = 0

    for word_index, word_row in enumerate(word_rows):
        scored_matches = score_schedule_matches(word_row.title, schedule_rows)
        match = confident_match(word_row.title, scored_matches)
        matched_count += 1 if match else 0
        skipped_count += 0 if match else 1
        rows.append(
            {
                "word_row_index": word_index,
                "word_title": word_row.title,
                "selected_row_index": match.row_index if match else None,
                "status": "matched" if match else "needs review",
                "candidates": [candidate_payload(item) for item in scored_matches[:5]],
            }
        )

    return {
        "rows": rows,
        "schedule_options": [
            {"row_index": row.row_index, "title": row.title, "dates": list(row.dates)}
            for row in schedule_rows
        ],
        "matched_count": matched_count,
        "skipped_count": skipped_count,
    }


def apply_word_matches(
    word_file_bytes: bytes,
    schedule_rows: list[ScheduleRow],
    matches: dict[int, int],
) -> tuple[bytes, int, int]:
    document = _open_word_document(word_file_bytes)
    word_rows = build_word_course_rows(document)
    schedule_by_index = {row.row_index: row for row in schedule_rows}
    matched_count = 0
    skipped_count = 0

    for word_index, word_row in enumerate(word_rows):
        selected = schedule_by_index.get(matches.get(word_index))
        if not selected:
            skipped_count += 1
            continue
        for target_index, date_value in zip((3, 4, 5), selected.dates):
            if target_index < len(word_row.row.cells):
                word_row.row.cells[target_index].text = date_value
        matched_count += 1

    output = io.BytesIO()
    document.save(output)
    return output.getvalue(), matched_count, skipped_count

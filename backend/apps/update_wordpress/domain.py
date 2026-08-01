from __future__ import annotations

import re
from datetime import date, datetime
from typing import Any
from urllib.parse import urlparse

MONTH_COLUMNS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
]


def extract_slug_from_permalink(url: str) -> str:
    parsed = urlparse((url or "").strip())
    path = (parsed.path or "").strip("/ ")
    if not path:
        return ""
    parts = [part for part in path.split("/") if part]
    if not parts:
        return ""
    return parts[-1]


def parse_effective_end_date(text: str) -> date | None:
    text = str(text or "").strip()
    if not text:
        return None

    single_day = re.fullmatch(r"(\d{1,2})\.(\d{1,2})\.(\d{4})", text)
    if single_day:
        day, month, year = map(int, single_day.groups())
        try:
            return date(year, month, day)
        except ValueError:
            return None

    multi_day = re.fullmatch(r"(\d{1,2})-(\d{1,2})\.(\d{1,2})\.(\d{4})", text)
    if multi_day:
        _start_day, end_day, month, year = map(int, multi_day.groups())
        try:
            return date(year, month, end_day)
        except ValueError:
            return None

    return None


def _normalize_excel_date_value(value: Any) -> str:
    if value is None:
        return ""
    if hasattr(value, "to_pydatetime"):
        value = value.to_pydatetime()
    if isinstance(value, datetime):
        return value.strftime("%d.%m.%Y")
    if isinstance(value, date):
        return value.strftime("%d.%m.%Y")
    return str(value).strip()


def split_cell_tokens(value: Any) -> list[str]:
    text = _normalize_excel_date_value(value)
    if not text or text.casefold() == "nan":
        return []
    return [text]


def parse_excel_dates_from_row(row: dict[str, Any]) -> list[str]:
    dates: list[str] = []
    lowered_row = {str(key).strip().casefold(): value for key, value in (row or {}).items()}

    for column in MONTH_COLUMNS:
        raw = lowered_row.get(column.casefold())
        for token in split_cell_tokens(raw):
            normalized = str(token).strip()
            if normalized:
                dates.append(normalized)

    return dates


def _filter_existing_non_expired_rows(
    program: list[dict[str, Any]],
    today: date,
) -> list[dict[str, str]]:
    normalized: list[dict[str, str]] = []
    seen: set[str] = set()

    for row in program or []:
        raw = str((row or {}).get("data", "")).strip()
        if not raw:
            continue
        end_date = parse_effective_end_date(raw)
        if end_date is None:
            continue
        if end_date >= today and raw not in seen:
            normalized.append({"data": raw})
            seen.add(raw)

    return normalized


def build_final_program(
    existing_program: list[dict[str, Any]],
    excel_dates: list[str],
    today: date,
) -> list[dict[str, str]]:
    seen: set[str] = set()
    result: list[dict[str, str]] = []

    for row in _filter_existing_non_expired_rows(existing_program, today):
        raw = row["data"]
        if raw not in seen:
            result.append({"data": raw})
            seen.add(raw)

    for raw in excel_dates:
        normalized = str(raw).strip()
        if not normalized:
            continue
        if normalized not in seen:
            result.append({"data": normalized})
            seen.add(normalized)

    return result


def valid_existing_program(
    existing_program: list[dict[str, Any]],
    today: date,
) -> list[dict[str, str]]:
    return _filter_existing_non_expired_rows(existing_program, today)

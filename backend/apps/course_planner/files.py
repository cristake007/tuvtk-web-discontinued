import csv
import io
import re
import unicodedata
from dataclasses import dataclass
from typing import Any, Iterable
from zipfile import BadZipFile

from openpyxl import Workbook, load_workbook
from openpyxl.utils import get_column_letter
from openpyxl.utils.exceptions import InvalidFileException

MAX_COURSES = 10_000
MAX_HEADER_SCAN_ROWS = 25

HEADER_ALIASES = {
    "title": ("title", "titlu", "nume curs"),
    "duration": ("durata curs", "duration", "durata"),
    "permalink": ("permalink", "link", "url"),
    "investment": ("investitie", "investment", "pret", "price"),
}
REQUIRED_HEADERS = ("title", "duration", "permalink")


class CourseFileError(ValueError):
    pass


@dataclass(frozen=True)
class CourseInput:
    title: str
    permalink: str
    duration_label: str
    investment: str
    duration: int
    original_order: int


def _normalize_header(value: Any) -> str:
    normalized = unicodedata.normalize("NFKD", str(value or ""))
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    return " ".join(ascii_value.strip().casefold().split())


def _display_value(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value).strip()


def _header_map(row: list[Any]) -> dict[str, int]:
    return {
        normalized: index
        for index, value in enumerate(row)
        if (normalized := _normalize_header(value))
    }


def _header_score(headers: dict[str, int]) -> int:
    return sum(
        any(alias in headers for alias in HEADER_ALIASES[name])
        for name in REQUIRED_HEADERS
    )


def _select_header_row(rows: list[list[Any]]) -> tuple[int, dict[str, int]]:
    best_index: int | None = None
    best_headers: dict[str, int] = {}
    best_score = -1

    for index, row in enumerate(rows[:MAX_HEADER_SCAN_ROWS]):
        headers = _header_map(row)
        if not headers:
            continue

        score = _header_score(headers)
        if score > best_score:
            best_index = index
            best_headers = headers
            best_score = score

        if score == len(REQUIRED_HEADERS):
            return index, headers

    if best_index is None:
        raise CourseFileError("Fișierul nu conține un rând de antet valid.")

    return best_index, best_headers


def _has_complete_header(rows: list[list[Any]]) -> bool:
    try:
        _, headers = _select_header_row(rows)
    except CourseFileError:
        return False
    return _header_score(headers) == len(REQUIRED_HEADERS)


def _parse_csv_rows(decoded: str, delimiter: str) -> list[list[Any]]:
    return [list(row) for row in csv.reader(io.StringIO(decoded), delimiter=delimiter)]


def _read_csv(data: bytes) -> list[list[Any]]:
    decoded: str | None = None
    for encoding in ("utf-8-sig", "utf-8", "cp1250", "latin-1"):
        try:
            decoded = data.decode(encoding)
            break
        except UnicodeDecodeError:
            continue

    if decoded is None:
        raise CourseFileError("Fișierul CSV nu poate fi decodat.")

    lines = decoded.splitlines()
    first_content_index = next(
        (index for index, line in enumerate(lines) if line.strip()),
        None,
    )
    if first_content_index is not None:
        separator_directive = re.fullmatch(
            r"\s*sep=(.)\s*",
            lines[first_content_index],
            flags=re.IGNORECASE,
        )
        if separator_directive is not None:
            delimiter = separator_directive.group(1)
            del lines[first_content_index]
            return _parse_csv_rows("\n".join(lines), delimiter)

    delimiters: list[str] = []
    sample = decoded[:8192]
    try:
        detected = csv.Sniffer().sniff(sample, delimiters=",;\t|").delimiter
        delimiters.append(detected)
    except csv.Error:
        pass

    for delimiter in (";", ",", "\t", "|"):
        if delimiter not in delimiters:
            delimiters.append(delimiter)

    fallback_rows: list[list[Any]] | None = None
    for delimiter in delimiters:
        rows = _parse_csv_rows(decoded, delimiter)
        if fallback_rows is None:
            fallback_rows = rows
        if _has_complete_header(rows):
            return rows

    return fallback_rows or []


def _read_xlsx(data: bytes) -> list[list[Any]]:
    workbook = load_workbook(io.BytesIO(data), read_only=True, data_only=True)
    try:
        sheet = workbook.active
        return [list(row) for row in sheet.iter_rows(values_only=True)]
    finally:
        workbook.close()


def _read_xls(data: bytes) -> list[list[Any]]:
    try:
        import xlrd
    except ModuleNotFoundError as exc:
        raise CourseFileError(
            "Suportul pentru fișiere .xls nu este instalat în backend. "
            "Reconstruiește imaginea backend sau folosește CSV/XLSX."
        ) from exc

    try:
        workbook = xlrd.open_workbook(file_contents=data)
    except xlrd.XLRDError as exc:
        raise CourseFileError("Fișierul .xls încărcat nu poate fi citit.") from exc

    sheet = workbook.sheet_by_index(0)
    return [sheet.row_values(index) for index in range(sheet.nrows)]


def parse_course_file(data: bytes, extension: str) -> list[CourseInput]:
    readers = {
        ".csv": _read_csv,
        ".xlsx": _read_xlsx,
        ".xls": _read_xls,
    }
    reader = readers.get(extension.casefold())
    if reader is None:
        raise CourseFileError("Formatul fișierului nu este acceptat.")

    try:
        rows = reader(data)
    except CourseFileError:
        raise
    except (
        BadZipFile,
        InvalidFileException,
        KeyError,
        OSError,
        UnicodeError,
        ValueError,
        csv.Error,
    ) as exc:
        raise CourseFileError("Fișierul încărcat nu poate fi citit.") from exc

    if not rows:
        raise CourseFileError("Fișierul nu conține date.")

    header_row_index, headers = _select_header_row(rows)

    def find_column(name: str, *, required: bool = True) -> int | None:
        for alias in HEADER_ALIASES[name]:
            if alias in headers:
                return headers[alias]
        if required:
            expected = HEADER_ALIASES[name][0]
            raise CourseFileError(f'Coloana obligatorie „{expected}” lipsește.')
        return None

    title_index = find_column("title")
    duration_index = find_column("duration")
    permalink_index = find_column("permalink")
    investment_index = find_column("investment", required=False)
    courses: list[CourseInput] = []

    for original_order, row in enumerate(rows[header_row_index + 1 :]):
        def cell(index: int | None) -> Any:
            if index is None or index >= len(row):
                return None
            return row[index]

        title = _display_value(cell(title_index))
        duration_label = _display_value(cell(duration_index))
        if not title or not duration_label:
            continue

        duration_match = re.search(r"\d+", duration_label)
        if duration_match is None:
            raise CourseFileError(
                f'Valoarea „{duration_label}” din coloana „Durata Curs” nu este validă.'
            )

        duration = int(duration_match.group())
        if not 1 <= duration <= 366:
            raise CourseFileError("Durata cursului trebuie să fie între 1 și 366 de zile.")

        courses.append(
            CourseInput(
                title=title,
                permalink=_display_value(cell(permalink_index)),
                duration_label=duration_label,
                investment=_display_value(cell(investment_index)),
                duration=duration,
                original_order=original_order,
            )
        )
        if len(courses) > MAX_COURSES:
            raise CourseFileError(f"Fișierul poate conține cel mult {MAX_COURSES} de cursuri.")

    if not courses:
        raise CourseFileError("Fișierul nu conține cursuri valide.")

    return courses


def create_excel_export(
    schedule: Iterable[dict[str, Any]],
    holidays: list[str],
) -> bytes:
    workbook = Workbook()
    schedule_sheet = workbook.active
    schedule_sheet.title = "Schedule"
    month_names = [
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
    headers = ["Title", "Permalink", "Durata Curs", "investitie", *month_names]
    schedule_sheet.append(headers)

    rows_by_title: dict[str, dict[str, Any]] = {}
    order: list[str] = []
    for item in sorted(schedule, key=lambda value: value.get("original_order", 0)):
        title = str(item["title"])
        if title not in rows_by_title:
            rows_by_title[title] = {
                "Title": title,
                "Permalink": item.get("permalink", ""),
                "Durata Curs": item.get("duration_label", ""),
                "investitie": item.get("investment", ""),
                **{month: "" for month in month_names},
            }
            order.append(title)
        rows_by_title[title][month_names[int(item["month"]) - 1]] = item["date_range"]

    for title in order:
        row = rows_by_title[title]
        schedule_sheet.append([row[header] for header in headers])

    if holidays:
        holidays_sheet = workbook.create_sheet("Holidays")
        holidays_sheet.append(["Holiday Date"])
        for holiday in holidays:
            holidays_sheet.append([holiday])

    for sheet in workbook.worksheets:
        for column_index, column in enumerate(sheet.iter_cols(), start=1):
            width = max(len(str(cell.value or "")) for cell in column) + 2
            sheet.column_dimensions[get_column_letter(column_index)].width = min(width, 80)

    output = io.BytesIO()
    workbook.save(output)
    return output.getvalue()

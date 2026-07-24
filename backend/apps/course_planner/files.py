import csv
import io
import re
import unicodedata
from dataclasses import dataclass
from typing import Any, Iterable
from zipfile import BadZipFile

import xlrd
from openpyxl import Workbook, load_workbook
from openpyxl.utils import get_column_letter
from openpyxl.utils.exceptions import InvalidFileException

MAX_COURSES = 10_000


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

    sample = decoded[:8192]
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=",;\t|")
        reader = csv.reader(io.StringIO(decoded), dialect)
    except csv.Error:
        reader = csv.reader(io.StringIO(decoded), delimiter=";")

    return [list(row) for row in reader]


def _read_xlsx(data: bytes) -> list[list[Any]]:
    workbook = load_workbook(io.BytesIO(data), read_only=True, data_only=True)
    try:
        sheet = workbook.active
        return [list(row) for row in sheet.iter_rows(values_only=True)]
    finally:
        workbook.close()


def _read_xls(data: bytes) -> list[list[Any]]:
    workbook = xlrd.open_workbook(file_contents=data)
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
    except (
        BadZipFile,
        InvalidFileException,
        KeyError,
        OSError,
        UnicodeError,
        ValueError,
        csv.Error,
        xlrd.XLRDError,
    ) as exc:
        raise CourseFileError("Fișierul încărcat nu poate fi citit.") from exc

    if not rows:
        raise CourseFileError("Fișierul nu conține date.")

    headers = {_normalize_header(value): index for index, value in enumerate(rows[0])}
    aliases = {
        "title": ("title", "titlu", "nume curs"),
        "duration": ("durata curs", "duration", "durata"),
        "permalink": ("permalink", "link", "url"),
        "investment": ("investitie", "investment", "pret", "price"),
    }

    def find_column(name: str, *, required: bool = True) -> int | None:
        for alias in aliases[name]:
            if alias in headers:
                return headers[alias]
        if required:
            expected = aliases[name][0]
            raise CourseFileError(f'Coloana obligatorie „{expected}” lipsește.')
        return None

    title_index = find_column("title")
    duration_index = find_column("duration")
    permalink_index = find_column("permalink")
    investment_index = find_column("investment", required=False)
    courses: list[CourseInput] = []

    for original_order, row in enumerate(rows[1:]):
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

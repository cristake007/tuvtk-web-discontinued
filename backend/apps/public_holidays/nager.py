import json
from dataclasses import dataclass
from datetime import date
from http.client import HTTPSConnection
from typing import Any


class NagerDateError(RuntimeError):
    pass


@dataclass(frozen=True, slots=True)
class NagerHoliday:
    date: date
    local_name: str
    english_name: str
    country_code: str
    national_holiday: bool
    subdivision_codes: tuple[str, ...]
    holiday_types: tuple[str, ...]


class NagerDateClient:
    host = "date.nager.at"
    response_limit = 1_048_576
    timeout_seconds = 15

    def fetch_romanian_holidays(self, year: int) -> list[NagerHoliday]:
        if year < 1970 or year > 2100:
            raise ValueError("Anul trebuie să fie între 1970 și 2100.")

        connection = HTTPSConnection(self.host, timeout=self.timeout_seconds)
        try:
            connection.request(
                "GET",
                f"/api/v3/PublicHolidays/{year}/RO",
                headers={
                    "Accept": "application/json",
                    "User-Agent": "TUVTK-Public-Holidays/1.0",
                },
            )
            response = connection.getresponse()
            if 300 <= response.status < 400:
                raise NagerDateError("Nager.Date a returnat o redirecționare neacceptată.")
            if response.status < 200 or response.status >= 300:
                raise NagerDateError(
                    f"Nager.Date a returnat codul HTTP {response.status}."
                )

            content_length = response.getheader("Content-Length")
            if content_length and content_length.isdigit():
                if int(content_length) > self.response_limit:
                    raise NagerDateError(
                        "Răspunsul Nager.Date depășește limita acceptată."
                    )

            body = response.read(self.response_limit + 1)
            if len(body) > self.response_limit:
                raise NagerDateError(
                    "Răspunsul Nager.Date depășește limita acceptată."
                )
        except NagerDateError:
            raise
        except OSError as exc:
            raise NagerDateError("Serviciul Nager.Date nu poate fi contactat.") from exc
        finally:
            connection.close()

        try:
            payload = json.loads(body.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise NagerDateError("Nager.Date a returnat un răspuns JSON invalid.") from exc

        return self._normalize_payload(payload, year)

    def _normalize_payload(self, payload: Any, expected_year: int) -> list[NagerHoliday]:
        if not isinstance(payload, list):
            raise NagerDateError("Răspunsul Nager.Date nu conține o listă validă.")

        holidays: list[NagerHoliday] = []
        seen: set[tuple[date, str]] = set()
        for index, row in enumerate(payload):
            if not isinstance(row, dict):
                raise NagerDateError(
                    f"Înregistrarea Nager.Date {index} nu este un obiect valid."
                )

            required = ("date", "localName", "name", "countryCode", "global", "counties", "types")
            if any(field not in row for field in required):
                raise NagerDateError(
                    f"Înregistrarea Nager.Date {index} este incompletă."
                )

            try:
                holiday_date = date.fromisoformat(row["date"])
            except (TypeError, ValueError) as exc:
                raise NagerDateError(
                    f"Înregistrarea Nager.Date {index} are o dată invalidă."
                ) from exc
            if holiday_date.year != expected_year:
                raise NagerDateError(
                    f"Înregistrarea Nager.Date {index} este în afara anului solicitat."
                )

            local_name = self._normalize_name(row["localName"], index, "localName")
            english_name = self._normalize_name(row["name"], index, "name")
            if row["countryCode"] != "RO":
                raise NagerDateError(
                    f"Înregistrarea Nager.Date {index} nu aparține României."
                )
            if not isinstance(row["global"], bool):
                raise NagerDateError(
                    f"Înregistrarea Nager.Date {index} are câmpul global invalid."
                )

            subdivision_codes = self._normalize_string_list(
                row["counties"], index, allow_none=True
            )
            holiday_types = self._normalize_string_list(
                row["types"], index, allow_none=False
            )
            if not holiday_types:
                raise NagerDateError(
                    f"Înregistrarea Nager.Date {index} nu are tipuri de sărbătoare."
                )

            identity = (holiday_date, local_name)
            if identity in seen:
                raise NagerDateError(
                    "Nager.Date a returnat două sărbători cu aceeași identitate."
                )
            seen.add(identity)
            holidays.append(
                NagerHoliday(
                    date=holiday_date,
                    local_name=local_name,
                    english_name=english_name,
                    country_code="RO",
                    national_holiday=row["global"],
                    subdivision_codes=tuple(subdivision_codes),
                    holiday_types=tuple(holiday_types),
                )
            )

        return holidays

    @staticmethod
    def _normalize_name(value: Any, index: int, field: str) -> str:
        if not isinstance(value, str):
            raise NagerDateError(
                f"Înregistrarea Nager.Date {index} are câmpul {field} invalid."
            )
        normalized = value.strip()
        if not normalized or len(normalized) > 255 or any(char in normalized for char in "<>="):
            raise NagerDateError(
                f"Înregistrarea Nager.Date {index} are câmpul {field} invalid."
            )
        return normalized

    @staticmethod
    def _normalize_string_list(
        value: Any,
        index: int,
        *,
        allow_none: bool,
    ) -> list[str]:
        if value is None and allow_none:
            return []
        if not isinstance(value, list) or any(not isinstance(item, str) for item in value):
            raise NagerDateError(
                f"Înregistrarea Nager.Date {index} conține o listă invalidă."
            )
        return sorted(set(value))


def fetch_romanian_holidays(year: int) -> list[NagerHoliday]:
    return NagerDateClient().fetch_romanian_holidays(year)

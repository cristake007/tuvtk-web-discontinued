from __future__ import annotations

from datetime import date
from typing import Any

from django.utils import timezone

from .client import WPCourseClient
from .domain import build_final_program, extract_slug_from_permalink, valid_existing_program
from .files import parse_course_date_rows
from .models import SafeCourseDateUpdaterSettings


def get_connection_settings() -> SafeCourseDateUpdaterSettings:
    settings, _created = SafeCourseDateUpdaterSettings.objects.get_or_create(pk=1)
    return settings


def save_connection_settings(*, wp_base_url: str, wp_username: str) -> SafeCourseDateUpdaterSettings:
    settings = get_connection_settings()
    settings.wp_base_url = wp_base_url
    settings.wp_username = wp_username
    settings.full_clean()
    settings.save()
    return settings


def build_wp_client(*, wp_base_url: str, wp_username: str, wp_app_password: str) -> WPCourseClient:
    return WPCourseClient(wp_base_url, wp_username, wp_app_password)


def build_preview_rows(data: bytes, extension: str) -> list[dict[str, Any]]:
    today = timezone.localdate()
    rows: list[dict[str, Any]] = []

    for parsed_row in parse_course_date_rows(data, extension):
        permalink = parsed_row["permalink"]
        slug = extract_slug_from_permalink(permalink)
        excel_dates = parsed_row["excel_dates"]
        excel_only_program = build_final_program([], excel_dates, today)
        excel_only_dates = [item["data"] for item in excel_only_program]

        status = "preview ready"
        error: str | None = None
        if not permalink:
            status = "error"
            error = "Lipsește permalink-ul."
        elif not slug:
            status = "error"
            error = "Nu s-a putut extrage slug-ul din permalink."

        rows.append(
            {
                "row_index": parsed_row["row_index"],
                "title": parsed_row["title"],
                "permalink": permalink,
                "slug": slug,
                "post_id": None,
                "existing_valid_dates": [],
                "excel_dates": excel_dates,
                "final_dates": excel_only_dates,
                "status": status,
                "error": error,
                "can_update": bool(slug and excel_only_dates),
                "payload": {"acf": {"program": excel_only_program if excel_only_program else False}},
            }
        )

    return rows


def resolve_slug(*, permalink: str, slug: str) -> str:
    return slug or extract_slug_from_permalink(permalink)


def fetch_current_dates(
    client: WPCourseClient,
    *,
    slug: str,
    permalink: str,
    post_id: int | None,
    excel_dates: list[str],
) -> dict[str, Any]:
    resolved_post_id = client.resolve_course_post_id(
        slug=slug, permalink=permalink, fallback_post_id=post_id
    )
    if not resolved_post_id:
        return {"post_id": None}

    today = timezone.localdate()
    existing_program = client.get_course(int(resolved_post_id)).get("acf", {}).get("program") or []
    current_valid = [item["data"] for item in valid_existing_program(existing_program, today)]
    final_valid = [item["data"] for item in build_final_program(existing_program, excel_dates, today)]
    final_program = [{"data": value} for value in final_valid]

    return {
        "post_id": int(resolved_post_id),
        "existing_valid_dates": current_valid,
        "final_dates": final_valid,
        "payload": {"acf": {"program": final_program if final_program else False}},
        "can_update": bool(final_valid),
    }


def update_course_row(
    client: WPCourseClient,
    *,
    slug: str,
    permalink: str,
    post_id: int | None,
    final_dates: list[str],
) -> dict[str, Any]:
    resolved_post_id = client.resolve_course_post_id(
        slug=slug, permalink=permalink, fallback_post_id=post_id
    )
    if not resolved_post_id:
        return {"post_id": None}

    today: date = timezone.localdate()
    course = client.get_course(int(resolved_post_id))
    existing_program = course.get("acf", {}).get("program") or []
    current_valid = [item["data"] for item in valid_existing_program(existing_program, today)]
    final_valid = [item["data"] for item in build_final_program(existing_program, final_dates, today)]

    if current_valid == final_valid:
        return {"post_id": int(resolved_post_id), "status": "no changes", "updated": False}

    client.update_course_program(int(resolved_post_id), [{"data": value} for value in final_valid])
    return {
        "post_id": int(resolved_post_id),
        "status": "success",
        "updated": True,
        "final_dates": final_valid,
    }

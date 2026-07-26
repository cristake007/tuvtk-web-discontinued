from collections.abc import Iterable
from pathlib import Path

from django.core.exceptions import ValidationError
from django.db import connections, transaction
from django.utils import timezone

from .files import OnrcSnapshotMetadata, validate_snapshot_directory
from .models import OnrcSnapshot

DATABASE_ALIAS = "registry"
COPY_CHUNK_SIZE = 1024 * 1024


def _copy_to_staging(
    cursor,
    *,
    path: Path,
    table: str,
    columns: Iterable[str],
) -> None:
    column_list = ", ".join(columns)
    copy_sql = (
        f"COPY {table} ({column_list}) FROM STDIN "
        "WITH (FORMAT CSV, HEADER TRUE, DELIMITER '^', ENCODING 'UTF8', "
        "QUOTE E'\\x01', "
        f"FORCE_NOT_NULL ({column_list}))"
    )
    with path.open("rb") as source, cursor.cursor.copy(copy_sql) as copy:
        while chunk := source.read(COPY_CHUNK_SIZE):
            copy.write(chunk)


def _create_snapshot(
    metadata: OnrcSnapshotMetadata,
    *,
    replace_failed: bool,
) -> OnrcSnapshot:
    existing = OnrcSnapshot.objects.using(DATABASE_ALIAS).filter(
        snapshot_date=metadata.snapshot_date
    ).first()
    if existing is not None and replace_failed:
        if existing.status != OnrcSnapshot.Status.FAILED:
            raise ValidationError(
                "Numai un snapshot ONRC eșuat poate fi înlocuit."
            )
        existing.delete(using=DATABASE_ALIAS)
        existing = None

    if existing is not None:
        raise ValidationError(
            f"Snapshotul ONRC {metadata.snapshot_date.isoformat()} există deja."
        )

    return OnrcSnapshot.objects.using(DATABASE_ALIAS).create(
        snapshot_date=metadata.snapshot_date,
        company_dataset_id=metadata.company_dataset_id,
        nomenclature_dataset_id=metadata.nomenclature_dataset_id,
        source_downloaded_at=metadata.downloaded_at_utc,
    )


def _import_companies(snapshot: OnrcSnapshot, data_directory: Path) -> int:
    columns = (
        "name",
        "cui",
        "registration_number",
        "registered_at",
        "euid",
        "legal_form",
        "country",
        "county",
        "locality",
        "street",
        "street_number",
        "building",
        "staircase",
        "floor",
        "apartment",
        "postal_code",
        "sector",
        "address_details",
        "website",
        "parent_company_country",
    )
    with transaction.atomic(using=DATABASE_ALIAS):
        with connections[DATABASE_ALIAS].cursor() as cursor:
            cursor.execute(
                """
                CREATE TEMP TABLE onrc_company_import (
                    source_row_number bigint GENERATED ALWAYS AS IDENTITY,
                    name text, cui text, registration_number text,
                    registered_at text, euid text, legal_form text,
                    country text, county text, locality text, street text,
                    street_number text, building text, staircase text,
                    floor text, apartment text, postal_code text, sector text,
                    address_details text, website text,
                    parent_company_country text
                ) ON COMMIT DROP
                """
            )
            _copy_to_staging(
                cursor,
                path=data_directory / "od_firme.csv",
                table="onrc_company_import",
                columns=columns,
            )
            cursor.execute(
                """
                INSERT INTO onrc_company (
                    snapshot_id, source_row_number, name, cui,
                    registration_number, registered_at, euid, legal_form,
                    country, county, locality, street, street_number,
                    building, staircase, floor, apartment, postal_code,
                    sector, address_details, website, parent_company_country
                )
                SELECT
                    %s, source_row_number, name, cui,
                    registration_number,
                    CASE
                        WHEN registered_at = '' THEN NULL
                        WHEN length(registered_at) = 10
                            THEN to_timestamp(registered_at, 'DD/MM/YYYY')
                        ELSE
                            to_timestamp(
                                registered_at,
                                'DD/MM/YYYY HH24:MI:SS'
                            )
                    END,
                    euid, legal_form, country, county, locality, street,
                    street_number, building, staircase, floor, apartment,
                    postal_code, sector, address_details, website,
                    parent_company_country
                FROM onrc_company_import
                """,
                [snapshot.pk],
            )
            return cursor.rowcount


def _import_simple_file(
    snapshot: OnrcSnapshot,
    data_directory: Path,
    *,
    filename: str,
    staging_table: str,
    staging_columns_sql: str,
    copy_columns: tuple[str, ...],
    insert_sql: str,
) -> int:
    with transaction.atomic(using=DATABASE_ALIAS):
        with connections[DATABASE_ALIAS].cursor() as cursor:
            cursor.execute(
                f"""
                CREATE TEMP TABLE {staging_table} (
                    source_row_number bigint GENERATED ALWAYS AS IDENTITY,
                    {staging_columns_sql}
                ) ON COMMIT DROP
                """
            )
            _copy_to_staging(
                cursor,
                path=data_directory / filename,
                table=staging_table,
                columns=copy_columns,
            )
            cursor.execute(insert_sql, [snapshot.pk])
            return cursor.rowcount


def import_onrc_snapshot(
    data_directory: Path,
    *,
    replace_failed: bool = False,
) -> OnrcSnapshot:
    metadata = validate_snapshot_directory(data_directory)
    snapshot = _create_snapshot(metadata, replace_failed=replace_failed)

    try:
        _import_simple_file(
            snapshot,
            data_directory,
            filename="n_caen.csv",
            staging_table="onrc_caen_import",
            staging_columns_sql=(
                "section text, subsection text, division text, "
                "group_code text, class_code text, name text, version text"
            ),
            copy_columns=(
                "section",
                "subsection",
                "division",
                "group_code",
                "class_code",
                "name",
                "version",
            ),
            insert_sql="""
                INSERT INTO onrc_caen_classification (
                    snapshot_id, source_row_number, section, subsection,
                    division, "group", class_code, name, version
                )
                SELECT %s, source_row_number, section, subsection, division,
                       group_code, class_code, name, version
                FROM onrc_caen_import
            """,
        )
        _import_simple_file(
            snapshot,
            data_directory,
            filename="n_stare_firma.csv",
            staging_table="onrc_status_nomenclature_import",
            staging_columns_sql="code text, name text",
            copy_columns=("code", "name"),
            insert_sql="""
                INSERT INTO onrc_company_status_nomenclature (
                    snapshot_id, code, name
                )
                SELECT %s, code, name
                FROM onrc_status_nomenclature_import
            """,
        )
        _import_simple_file(
            snapshot,
            data_directory,
            filename="n_versiune_caen.csv",
            staging_table="onrc_caen_version_import",
            staging_columns_sql="code text, description text",
            copy_columns=("code", "description"),
            insert_sql="""
                INSERT INTO onrc_caen_version (
                    snapshot_id, code, description
                )
                SELECT %s, code, description
                FROM onrc_caen_version_import
            """,
        )
        company_count = _import_companies(snapshot, data_directory)
        authorized_caen_count = _import_simple_file(
            snapshot,
            data_directory,
            filename="od_caen_autorizat.csv",
            staging_table="onrc_authorized_caen_import",
            staging_columns_sql=(
                "registration_number text, caen_code text, caen_version text"
            ),
            copy_columns=("registration_number", "caen_code", "caen_version"),
            insert_sql="""
                INSERT INTO onrc_authorized_caen (
                    snapshot_id, source_row_number, registration_number,
                    caen_code, caen_version
                )
                SELECT %s, source_row_number, registration_number,
                       caen_code, caen_version
                FROM onrc_authorized_caen_import
            """,
        )
        company_status_count = _import_simple_file(
            snapshot,
            data_directory,
            filename="od_stare_firma.csv",
            staging_table="onrc_company_status_import",
            staging_columns_sql="registration_number text, status_code text",
            copy_columns=("registration_number", "status_code"),
            insert_sql="""
                INSERT INTO onrc_company_status (
                    snapshot_id, source_row_number, registration_number,
                    status_code
                )
                SELECT %s, source_row_number, registration_number, status_code
                FROM onrc_company_status_import
            """,
        )

        with transaction.atomic(using=DATABASE_ALIAS):
            OnrcSnapshot.objects.using(DATABASE_ALIAS).filter(
                status=OnrcSnapshot.Status.ACTIVE
            ).update(status=OnrcSnapshot.Status.ARCHIVED)
            OnrcSnapshot.objects.using(DATABASE_ALIAS).filter(pk=snapshot.pk).update(
                status=OnrcSnapshot.Status.ACTIVE,
                activated_at=timezone.now(),
                company_count=company_count,
                authorized_caen_count=authorized_caen_count,
                company_status_count=company_status_count,
            )
        snapshot.refresh_from_db(using=DATABASE_ALIAS)
        return snapshot
    except Exception as exc:
        OnrcSnapshot.objects.using(DATABASE_ALIAS).filter(pk=snapshot.pk).update(
            status=OnrcSnapshot.Status.FAILED,
            failure_detail=str(exc)[:2000],
        )
        raise

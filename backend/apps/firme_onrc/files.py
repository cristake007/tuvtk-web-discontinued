import csv
import json
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path
from uuid import UUID

from django.core.exceptions import ValidationError


EXPECTED_HEADERS = {
    "n_caen.csv": (
        "SECTIUNEA",
        "SUBSECTIUNEA",
        "DIVIZIUNEA",
        "GRUPA",
        "CLASA",
        "DENUMIRE",
        "VERSIUNE_CAEN",
    ),
    "n_stare_firma.csv": ("COD", "DENUMIRE"),
    "n_versiune_caen.csv": ("COD", "DESCRIERE"),
    "od_caen_autorizat.csv": (
        "COD_INMATRICULARE",
        "COD_CAEN_AUTORIZAT",
        "VER_CAEN_AUTORIZAT",
    ),
    "od_firme.csv": (
        "DENUMIRE",
        "CUI",
        "COD_INMATRICULARE",
        "DATA_INMATRICULARE",
        "EUID",
        "FORMA_JURIDICA",
        "ADR_TARA",
        "ADR_JUDET",
        "ADR_LOCALITATE",
        "ADR_DEN_STRADA",
        "ADR_NR_STRADA",
        "ADR_BLOC",
        "ADR_SCARA",
        "ADR_ETAJ",
        "ADR_APARTAMENT",
        "ADR_COD_POSTAL",
        "ADR_SECTOR",
        "ADR_COMPLETARE",
        "WEB",
        "TARA_FIRMA_MAMA",
    ),
    "od_stare_firma.csv": ("COD_INMATRICULARE", "COD"),
}


@dataclass(frozen=True)
class OnrcSnapshotMetadata:
    snapshot_date: date
    company_dataset_id: UUID
    nomenclature_dataset_id: UUID
    nomenclature_version_available: bool
    downloaded_at_utc: datetime


def validate_snapshot_directory(data_directory: Path) -> OnrcSnapshotMetadata:
    if not data_directory.is_dir():
        raise ValidationError(f"Directorul ONRC nu există: {data_directory}")

    expected_files = {*EXPECTED_HEADERS, "snapshot.json"}
    missing_files = sorted(
        filename
        for filename in expected_files
        if not (data_directory / filename).is_file()
    )
    if missing_files:
        raise ValidationError(
            f"Lipsesc fișiere ONRC obligatorii: {', '.join(missing_files)}"
        )

    for filename, expected_header in EXPECTED_HEADERS.items():
        path = data_directory / filename
        with path.open("r", encoding="utf-8-sig", newline="") as source:
            actual_header = tuple(next(csv.reader(source, delimiter="^"), ()))
        if actual_header != expected_header:
            raise ValidationError(
                f"Header invalid pentru {filename}. "
                f"Așteptat {expected_header}, primit {actual_header}."
            )

    try:
        metadata_payload = json.loads(
            (data_directory / "snapshot.json").read_text(encoding="utf-8")
        )
        nomenclature_version_available = metadata_payload[
            "n_versiune_caen_available"
        ]
        if not isinstance(nomenclature_version_available, bool):
            raise ValueError("n_versiune_caen_available must be boolean")

        downloaded_at_utc = datetime.fromisoformat(
            metadata_payload["downloaded_at_utc"].replace("Z", "+00:00")
        )
        if downloaded_at_utc.tzinfo is None:
            raise ValueError("downloaded_at_utc must include a timezone")

        return OnrcSnapshotMetadata(
            snapshot_date=date.fromisoformat(metadata_payload["snapshot_date"]),
            company_dataset_id=UUID(metadata_payload["company_dataset_id"]),
            nomenclature_dataset_id=UUID(
                metadata_payload["nomenclature_dataset_id"]
            ),
            nomenclature_version_available=nomenclature_version_available,
            downloaded_at_utc=downloaded_at_utc,
        )
    except (KeyError, TypeError, ValueError, json.JSONDecodeError) as exc:
        raise ValidationError("snapshot.json conține metadate invalide.") from exc

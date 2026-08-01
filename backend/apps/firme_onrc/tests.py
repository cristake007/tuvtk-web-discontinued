import json
from datetime import date
from pathlib import Path
from tempfile import TemporaryDirectory
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from django.core.exceptions import ValidationError
from django.test import SimpleTestCase

from apps.firme_onrc.files import EXPECTED_HEADERS, validate_snapshot_directory
from apps.firme_onrc.importer import _copy_to_staging
from apps.firme_onrc.models import OnrcSnapshot
from apps.firme_onrc.search_index import (
    INDEX_ADMIN_TIMEOUT,
    build_company_index,
)
from config.database_routers import RegistryRouter


def model_instance(app_label: str):
    return SimpleNamespace(_meta=SimpleNamespace(app_label=app_label))


class RegistryRouterTests(SimpleTestCase):
    def setUp(self):
        self.router = RegistryRouter()
        self.registry_model = model_instance("firme_onrc")
        self.core_model = model_instance("core")

    def test_firme_onrc_reads_and_writes_use_registry(self):
        self.assertEqual(self.router.db_for_read(self.registry_model), "registry")
        self.assertEqual(self.router.db_for_write(self.registry_model), "registry")

    def test_only_registry_apps_can_migrate_to_registry(self):
        self.assertTrue(self.router.allow_migrate("registry", "firme_onrc"))
        self.assertFalse(self.router.allow_migrate("default", "firme_onrc"))
        self.assertFalse(self.router.allow_migrate("registry", "auth"))

    def test_cross_database_relations_are_rejected(self):
        self.assertFalse(
            self.router.allow_relation(self.registry_model, self.core_model)
        )
        self.assertTrue(
            self.router.allow_relation(self.registry_model, self.registry_model)
        )


class OnrcSnapshotFilesTests(SimpleTestCase):
    def create_snapshot_files(self, directory: Path):
        for filename, header in EXPECTED_HEADERS.items():
            (directory / filename).write_text(
                f"{'^'.join(header)}\r\n",
                encoding="utf-8-sig",
            )
        (directory / "snapshot.json").write_text(
            json.dumps(
                {
                    "snapshot_date": "2026-07-08",
                    "company_dataset_id": "6f73f5a0-f981-4676-85fa-3a66a963984e",
                    "nomenclature_dataset_id": "e7d37f81-ca9b-498e-b672-8b971c202e39",
                    "n_versiune_caen_available": True,
                    "downloaded_at_utc": "2026-07-22T15:40:52Z",
                }
            ),
            encoding="utf-8",
        )

    def test_valid_snapshot_contract_is_accepted(self):
        with TemporaryDirectory() as temporary_directory:
            directory = Path(temporary_directory)
            self.create_snapshot_files(directory)

            metadata = validate_snapshot_directory(directory)

        self.assertEqual(metadata.snapshot_date.isoformat(), "2026-07-08")
        self.assertTrue(metadata.nomenclature_version_available)

    def test_missing_required_file_is_rejected(self):
        with TemporaryDirectory() as temporary_directory:
            directory = Path(temporary_directory)
            self.create_snapshot_files(directory)
            (directory / "od_firme.csv").unlink()

            with self.assertRaises(ValidationError):
                validate_snapshot_directory(directory)

    def test_changed_csv_header_is_rejected(self):
        with TemporaryDirectory() as temporary_directory:
            directory = Path(temporary_directory)
            self.create_snapshot_files(directory)
            (directory / "od_firme.csv").write_text(
                "CUI^DENUMIRE\r\n",
                encoding="utf-8-sig",
            )

            with self.assertRaises(ValidationError):
                validate_snapshot_directory(directory)


class OnrcCopyTests(SimpleTestCase):
    def test_copy_preserves_empty_fields_and_literal_quotes(self):
        with TemporaryDirectory() as temporary_directory:
            path = Path(temporary_directory) / "source.csv"
            path.write_bytes(
                b'name^subsection^address\r\nCompany^^Str. "Quoted"\r\n'
            )
            cursor = MagicMock()

            _copy_to_staging(
                cursor,
                path=path,
                table="onrc_company_import",
                columns=("name", "subsection", "address"),
            )

        copy_sql = cursor.cursor.copy.call_args.args[0]
        self.assertIn("QUOTE E'\\x01'", copy_sql)
        self.assertIn(
            "FORCE_NOT_NULL (name, subsection, address)",
            copy_sql,
        )


class OnrcSearchIndexTests(SimpleTestCase):
    @patch(
        "apps.firme_onrc.search_index.helpers.bulk",
        return_value=(0, []),
    )
    @patch("apps.firme_onrc.search_index.get_opensearch_client")
    def test_index_administration_uses_extended_timeout(
        self,
        get_client,
        bulk,
    ):
        client = get_client.return_value
        client.indices.exists.return_value = False
        client.indices.exists_alias.return_value = False
        client.count.return_value = {"count": 0}
        snapshot = SimpleNamespace(
            pk=1,
            snapshot_date=date(2026, 7, 8),
            status=OnrcSnapshot.Status.ACTIVE,
            company_count=0,
        )

        target_index, indexed_count = build_company_index(snapshot)

        self.assertEqual(target_index, "firme-onrc-companies-20260708-1")
        self.assertEqual(indexed_count, 0)
        client.indices.refresh.assert_called_once_with(
            index=target_index,
            request_timeout=INDEX_ADMIN_TIMEOUT,
        )
        client.count.assert_called_once_with(
            index=target_index,
            request_timeout=INDEX_ADMIN_TIMEOUT,
        )
        bulk.assert_called_once()

import json
from datetime import UTC, date, datetime
from io import StringIO
from pathlib import Path
from tempfile import TemporaryDirectory
from types import SimpleNamespace
from unittest.mock import MagicMock, patch
from uuid import UUID

from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import SimpleTestCase, TransactionTestCase

from apps.firme_onrc.files import (
    EXPECTED_HEADERS,
    OnrcSnapshotMetadata,
    validate_snapshot_directory,
)
from apps.firme_onrc.importer import _copy_to_staging, import_onrc_snapshot
from apps.firme_onrc.models import OnrcSnapshot
from apps.firme_onrc.search_index import (
    INDEX_ADMIN_TIMEOUT,
    build_company_index,
)
from config.database_routers import RegistryRouter


def model_instance(app_label: str):
    return SimpleNamespace(_meta=SimpleNamespace(app_label=app_label))


def snapshot_metadata(snapshot_date: date) -> OnrcSnapshotMetadata:
    return OnrcSnapshotMetadata(
        snapshot_date=snapshot_date,
        company_dataset_id=UUID("6f73f5a0-f981-4676-85fa-3a66a963984e"),
        nomenclature_dataset_id=UUID("e7d37f81-ca9b-498e-b672-8b971c202e39"),
        nomenclature_version_available=True,
        downloaded_at_utc=datetime(2026, 7, 22, 15, 40, 52, tzinfo=UTC),
    )


def create_snapshot(snapshot_date: date, status: str) -> OnrcSnapshot:
    metadata = snapshot_metadata(snapshot_date)
    return OnrcSnapshot.objects.using("registry").create(
        snapshot_date=metadata.snapshot_date,
        company_dataset_id=metadata.company_dataset_id,
        nomenclature_dataset_id=metadata.nomenclature_dataset_id,
        source_downloaded_at=metadata.downloaded_at_utc,
        status=status,
    )


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
        self.assertFalse(self.router.allow_relation(self.registry_model, self.core_model))
        self.assertTrue(self.router.allow_relation(self.registry_model, self.registry_model))


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
            path.write_bytes(b'name^subsection^address\r\nCompany^^Str. "Quoted"\r\n')
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


class OnrcSnapshotImportTests(TransactionTestCase):
    databases = {"registry"}

    @patch("apps.firme_onrc.importer._import_companies", return_value=23)
    @patch(
        "apps.firme_onrc.importer._import_simple_file",
        side_effect=(7, 2, 1, 31, 19),
    )
    @patch("apps.firme_onrc.importer.validate_snapshot_directory")
    def test_import_activates_new_snapshot_and_archives_previous_one(
        self,
        validate_directory,
        import_simple_file,
        import_companies,
    ):
        previous = create_snapshot(date(2026, 7, 1), OnrcSnapshot.Status.ACTIVE)
        validate_directory.return_value = snapshot_metadata(date(2026, 7, 8))

        snapshot = import_onrc_snapshot(Path("/snapshot"))

        previous.refresh_from_db(using="registry")
        self.assertEqual(previous.status, OnrcSnapshot.Status.ARCHIVED)
        self.assertEqual(snapshot.status, OnrcSnapshot.Status.ACTIVE)
        self.assertEqual(snapshot.company_count, 23)
        self.assertEqual(snapshot.authorized_caen_count, 31)
        self.assertEqual(snapshot.company_status_count, 19)
        self.assertIsNotNone(snapshot.activated_at)
        self.assertEqual(import_simple_file.call_count, 5)
        import_companies.assert_called_once_with(snapshot, Path("/snapshot"))

    @patch(
        "apps.firme_onrc.importer._import_simple_file",
        side_effect=RuntimeError("fișier incomplet"),
    )
    @patch("apps.firme_onrc.importer.validate_snapshot_directory")
    def test_partial_import_marks_new_snapshot_failed(
        self,
        validate_directory,
        import_simple_file,
    ):
        validate_directory.return_value = snapshot_metadata(date(2026, 7, 8))

        with self.assertRaisesRegex(RuntimeError, "fișier incomplet"):
            import_onrc_snapshot(Path("/snapshot"))

        snapshot = OnrcSnapshot.objects.using("registry").get()
        self.assertEqual(snapshot.status, OnrcSnapshot.Status.FAILED)
        self.assertEqual(snapshot.failure_detail, "fișier incomplet")
        import_simple_file.assert_called_once()

    @patch("apps.firme_onrc.importer._import_companies", return_value=0)
    @patch("apps.firme_onrc.importer._import_simple_file", return_value=0)
    @patch("apps.firme_onrc.importer.validate_snapshot_directory")
    def test_replace_failed_removes_failed_snapshot_before_import(
        self,
        validate_directory,
        import_simple_file,
        import_companies,
    ):
        failed = create_snapshot(date(2026, 7, 8), OnrcSnapshot.Status.FAILED)
        validate_directory.return_value = snapshot_metadata(date(2026, 7, 8))

        snapshot = import_onrc_snapshot(Path("/snapshot"), replace_failed=True)

        self.assertNotEqual(snapshot.pk, failed.pk)
        self.assertEqual(snapshot.status, OnrcSnapshot.Status.ACTIVE)
        self.assertFalse(OnrcSnapshot.objects.using("registry").filter(pk=failed.pk).exists())


class OnrcManagementCommandTests(TransactionTestCase):
    databases = {"registry"}

    @patch("apps.firme_onrc.management.commands.check_onrc_snapshot.validate_snapshot_directory")
    def test_check_snapshot_command_reports_success(self, validate_directory):
        validate_directory.return_value = snapshot_metadata(date(2026, 7, 8))
        stdout = StringIO()

        call_command("check_onrc_snapshot", stdout=stdout)

        self.assertIn("Snapshot ONRC valid: 2026-07-08", stdout.getvalue())

    @patch(
        "apps.firme_onrc.management.commands.check_onrc_snapshot.validate_snapshot_directory",
        side_effect=ValidationError("snapshot invalid"),
    )
    def test_check_snapshot_command_wraps_validation_failure(self, _validate):
        with self.assertRaisesRegex(CommandError, "snapshot invalid"):
            call_command("check_onrc_snapshot")

    @patch("apps.firme_onrc.management.commands.import_onrc_snapshot.import_onrc_snapshot")
    def test_import_snapshot_command_forwards_options(self, import_snapshot):
        import_snapshot.return_value = SimpleNamespace(
            snapshot_date=date(2026, 7, 8),
            company_count=23,
        )
        stdout = StringIO()

        call_command("import_onrc_snapshot", "--replace-failed", stdout=stdout)

        self.assertTrue(import_snapshot.call_args.kwargs["replace_failed"])
        self.assertIn("Snapshot ONRC activat: 2026-07-08", stdout.getvalue())

    @patch(
        "apps.firme_onrc.management.commands.import_onrc_snapshot.import_onrc_snapshot",
        side_effect=RuntimeError("import eșuat"),
    )
    def test_import_snapshot_command_wraps_import_failure(self, _import):
        with self.assertRaisesRegex(CommandError, "import eșuat"):
            call_command("import_onrc_snapshot")

    @patch(
        "apps.firme_onrc.management.commands.index_onrc_snapshot.build_company_index",
        return_value=("firme-onrc-companies-20260708-1", 23),
    )
    def test_index_snapshot_command_reports_success(self, build_index):
        snapshot = create_snapshot(date(2026, 7, 8), OnrcSnapshot.Status.ACTIVE)
        stdout = StringIO()

        call_command("index_onrc_snapshot", stdout=stdout)

        build_index.assert_called_once_with(snapshot)
        self.assertIn("Index OpenSearch activat", stdout.getvalue())

    @patch(
        "apps.firme_onrc.management.commands.index_onrc_snapshot.build_company_index",
        side_effect=RuntimeError("index eșuat"),
    )
    def test_index_snapshot_command_wraps_index_failure(self, _build_index):
        create_snapshot(date(2026, 7, 8), OnrcSnapshot.Status.ACTIVE)

        with self.assertRaisesRegex(CommandError, "index eșuat"):
            call_command("index_onrc_snapshot")


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

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from apps.firme_onrc.files import EXPECTED_HEADERS, validate_snapshot_directory


class Command(BaseCommand):
    help = "Validează fișierele snapshotului ONRC fără a importa date."

    def handle(self, *args, **options):
        try:
            metadata = validate_snapshot_directory(settings.ONRC_DATA_DIR)
        except Exception as exc:
            raise CommandError(str(exc)) from exc

        self.stdout.write(
            self.style.SUCCESS(
                f"Snapshot ONRC valid: {metadata.snapshot_date.isoformat()} "
                f"({len(EXPECTED_HEADERS)} fișiere CSV)."
            )
        )

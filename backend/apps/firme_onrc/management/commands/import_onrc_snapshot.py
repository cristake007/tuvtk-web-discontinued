from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from apps.firme_onrc.importer import import_onrc_snapshot


class Command(BaseCommand):
    help = "Importă snapshotul ONRC din ONRC_DATA_DIR în baza registry."

    def add_arguments(self, parser):
        parser.add_argument(
            "--replace-failed",
            action="store_true",
            help=(
                "Șterge și reia snapshotul cu aceeași dată numai dacă importul "
                "anterior are starea eșuat."
            ),
        )

    def handle(self, *args, **options):
        self.stdout.write(
            f"Import snapshot ONRC din {settings.ONRC_DATA_DIR} în baza registry..."
        )
        try:
            snapshot = import_onrc_snapshot(
                settings.ONRC_DATA_DIR,
                replace_failed=options["replace_failed"],
            )
        except Exception as exc:
            raise CommandError(str(exc)) from exc

        self.stdout.write(
            self.style.SUCCESS(
                f"Snapshot ONRC activat: {snapshot.snapshot_date.isoformat()} "
                f"({snapshot.company_count} firme)."
            )
        )

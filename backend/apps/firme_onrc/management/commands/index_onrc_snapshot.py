from django.core.management.base import BaseCommand, CommandError

from apps.firme_onrc.models import OnrcSnapshot
from apps.firme_onrc.search_index import build_company_index


class Command(BaseCommand):
    help = "Construiește indexul OpenSearch pentru snapshotul ONRC activ."

    def handle(self, *args, **options):
        snapshot = (
            OnrcSnapshot.objects.using("registry")
            .filter(status=OnrcSnapshot.Status.ACTIVE)
            .first()
        )
        if snapshot is None:
            raise CommandError("Nu există un snapshot ONRC activ.")

        self.stdout.write(
            f"Indexare OpenSearch pentru snapshotul {snapshot.snapshot_date}..."
        )
        try:
            target_index, count = build_company_index(snapshot)
        except Exception as exc:
            raise CommandError(str(exc)) from exc

        self.stdout.write(
            self.style.SUCCESS(
                f"Index OpenSearch activat: {target_index} ({count} firme)."
            )
        )

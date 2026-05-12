from django.core.management.base import BaseCommand
from catalog.recommendations import update_relation_weights


class Command(BaseCommand):
    help = (
        "Recalculates FREQUENTLY_BOUGHT_TOGETHER weights on MedicineRelation "
        "from order history. Run daily via cron or Celery beat."
    )

    def handle(self, *args, **options):
        self.stdout.write("Running recommendation weight update...")
        result = update_relation_weights()
        self.stdout.write(
            self.style.SUCCESS(
                f"Done. Created: {result['created']} | Updated: {result['updated']}"
            )
        )

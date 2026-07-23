from django.core.management import BaseCommand

from users.models import User


class Command(BaseCommand):
    help = "Creates an initial admin user"

    def handle(self, *args, **options):
        email = "admin@example.com"
        if User.all_objects.filter(email=email).exists():
            self.stdout.write(self.style.WARNING(f"Admin user '{email}' already exists."))
            return

        User.objects.create_superuser(
            email=email,
            password="admin123",
            first_name="test",
            last_name="admin",
        )
        self.stdout.write(self.style.SUCCESS(f"Admin user '{email}' created successfully."))
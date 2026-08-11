import uuid

from django.conf import settings
from django.core.cache import cache
from django.core.management.base import BaseCommand, CommandError
from django.db import connection
from django.db.migrations.executor import MigrationExecutor


class Command(BaseCommand):
    help = "Verify database, cache, migrations, and required release configuration."

    def add_arguments(self, parser):
        parser.add_argument("--allow-debug", action="store_true")
        parser.add_argument("--require-openai", action="store_true")

    def handle(self, *args, **options):
        failures = []

        if settings.DEBUG and not options["allow_debug"]:
            failures.append("DEBUG must be disabled")
        if not settings.SECRET_KEY or settings.SECRET_KEY.startswith("django-insecure"):
            failures.append("SECRET_KEY must be production-safe")
        if options["require_openai"] and not getattr(settings, "OPENAI_API_KEY", ""):
            failures.append("OPENAI_API_KEY is required")

        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
            executor = MigrationExecutor(connection)
            if executor.migration_plan(executor.loader.graph.leaf_nodes()):
                failures.append("database has unapplied migrations")
        except Exception as exc:
            failures.append(f"database check failed ({exc.__class__.__name__})")

        try:
            key = f"release-check:{uuid.uuid4()}"
            cache.set(key, "ok", timeout=10)
            if cache.get(key) != "ok":
                failures.append("cache round-trip failed")
            cache.delete(key)
        except Exception as exc:
            failures.append(f"cache check failed ({exc.__class__.__name__})")

        if failures:
            raise CommandError("; ".join(failures))

        self.stdout.write(self.style.SUCCESS("ClientFlow release checks passed."))

from django.apps import AppConfig


class AutomationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'clientflow.apps.automation'
    verbose_name = 'Automation'

    def ready(self):
        from . import signals  # noqa: F401

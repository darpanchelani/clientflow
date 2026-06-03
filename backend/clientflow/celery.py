"""
Celery application configuration for ClientFlow.
"""
import os

from celery import Celery


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'clientflow.settings.development')

app = Celery('clientflow')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

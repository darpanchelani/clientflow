"""
Development settings for ClientFlow
"""

from .base import *

DEBUG = True
ALLOWED_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0"]

import sys

if "test" in sys.argv:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("DB_NAME", "clientflow"),
            "USER": os.getenv("DB_USER", "postgres"),
            "PASSWORD": os.getenv("DB_PASSWORD", "root"),
            "HOST": os.getenv("DB_HOST", "localhost"),
            "PORT": os.getenv("DB_PORT", "5432"),
            "ATOMIC_REQUESTS": False,
        }
    }

CORS_ALLOW_ALL_ORIGINS = True

# Keep the development server usable without requiring Redis. The production
# and staging settings replace this with Redis for shared throttling and cache
# state across processes.
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "clientflow-development",
    }
}

LOGGING["loggers"]["django"]["level"] = "DEBUG"
LOGGING["loggers"]["clientflow"]["level"] = "DEBUG"

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"] = timedelta(hours=1)

SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
SECURE_HSTS_SECONDS = 0

CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")

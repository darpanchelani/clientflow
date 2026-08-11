"""Staging settings: production security with non-production service identifiers."""
from .production import *


ALLOWED_HOSTS = env_list("ALLOWED_HOSTS", "staging-api.clientflow.io")
CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS", "https://staging.clientflow.io")

# Staging may terminate TLS at a local reverse proxy during smoke tests.
SECURE_SSL_REDIRECT = os.getenv("SECURE_SSL_REDIRECT", "True").lower() == "true"
LOGGING["loggers"]["django"]["level"] = os.getenv("DJANGO_LOG_LEVEL", "INFO")
LOGGING["loggers"]["clientflow"]["level"] = os.getenv("CLIENTFLOW_LOG_LEVEL", "INFO")

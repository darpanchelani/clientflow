import os

from .base import *


DEBUG = False
SECRET_KEY = "clientflow-test-secret-key-longer-than-thirty-two-bytes"
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.getenv('TEST_DATABASE_NAME', ':memory:'),
    }
}
PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'
CACHES = {'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}}
CELERY_TASK_ALWAYS_EAGER = True

"""ClientFlow Django Project"""

from .celery import app as celery_app

__version__ = '1.0.0'

__all__ = ('celery_app',)
import importlib.util
import pkgutil


# Django Filter 23.x still calls the function removed by Python 3.14. Keep the
# compatibility shim at package import time so management commands and pytest
# initialize Django consistently.
if not hasattr(pkgutil, 'find_loader'):
    def _find_loader(fullname):
        try:
            spec = importlib.util.find_spec(fullname)
            return spec.loader if spec else None
        except (ImportError, AttributeError, ValueError):
            return None

    pkgutil.find_loader = _find_loader

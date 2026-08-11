from django.core.cache import cache
from django.db import connection
from django.http import JsonResponse


def health_live(_request):
    return JsonResponse({"status": "ok", "service": "clientflow-api"})


def health_ready(_request):
    checks = {"database": False, "cache": False}
    errors = {}

    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        checks["database"] = True
    except Exception as exc:  # pragma: no cover - depends on infrastructure failure
        errors["database"] = exc.__class__.__name__

    try:
        cache_key = "health:ready"
        cache.set(cache_key, "ok", timeout=10)
        checks["cache"] = cache.get(cache_key) == "ok"
        if not checks["cache"]:
            errors["cache"] = "CacheReadFailed"
    except Exception as exc:  # pragma: no cover - depends on infrastructure failure
        errors["cache"] = exc.__class__.__name__

    ready = all(checks.values())
    payload = {"status": "ok" if ready else "degraded", "checks": checks}
    if errors:
        payload["errors"] = errors
    return JsonResponse(payload, status=200 if ready else 503)

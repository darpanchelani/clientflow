import json

import pytest
from django.core.management import call_command
from rest_framework_simplejwt.tokens import RefreshToken

from clientflow.apps.leads.models import Lead
from clientflow.apps.users.models import User
from clientflow.utils.logging import JsonFormatter


@pytest.mark.django_db
def test_health_endpoints(client):
    live = client.get("/health/live")
    ready = client.get("/health/ready")

    assert live.status_code == 200
    assert live.json()["status"] == "ok"
    assert ready.status_code == 200
    assert ready.json()["checks"] == {"database": True, "cache": True}
    assert live["X-Request-ID"]


@pytest.mark.django_db
def test_graphql_requires_authentication(client):
    response = client.post(
        "/graphql/", {"query": "{ me { email } }"}, content_type="application/json"
    )

    assert response.status_code == 200
    assert response.json()["errors"][0]["extensions"]["code"] == "UNAUTHENTICATED"


@pytest.mark.django_db
def test_graphql_uses_jwt_and_enforces_organization_scope(client):
    user = User.objects.create_user(
        email="owner@example.com", password="secure-password", organization_name="Acme"
    )
    other = User.objects.create_user(
        email="other@example.com", password="secure-password", organization_name="Other"
    )
    Lead.objects.create(name="Visible", owner=user, organization_name="Acme")
    Lead.objects.create(name="Hidden", owner=other, organization_name="Other")
    access = str(RefreshToken.for_user(user).access_token)

    response = client.post(
        "/graphql/",
        {"query": "{ me { email organizationName } leads { name } }"},
        content_type="application/json",
        HTTP_AUTHORIZATION=f"Bearer {access}",
    )

    assert response.status_code == 200
    assert response.json()["data"] == {
        "me": {"email": "owner@example.com", "organizationName": "Acme"},
        "leads": [{"name": "Visible"}],
    }


def test_json_formatter_emits_machine_readable_log_record():
    import logging

    record = logging.LogRecord(
        "clientflow.test", logging.INFO, __file__, 1, "ready %s", ("now",), None
    )
    payload = json.loads(JsonFormatter().format(record))

    assert payload["level"] == "INFO"
    assert payload["logger"] == "clientflow.test"
    assert payload["message"] == "ready now"


@pytest.mark.django_db
def test_release_check_command_passes_in_test_environment(settings, capsys):
    settings.SECRET_KEY = "release-check-secret-that-does-not-use-the-insecure-prefix"

    call_command("check_release")

    assert "release checks passed" in capsys.readouterr().out

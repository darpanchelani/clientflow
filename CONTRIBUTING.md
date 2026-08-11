# Contributing to ClientFlow

## Development setup

Use Python 3.12 and Node.js 20. Copy `.env.example` to `.env`, then start the
stack with `docker compose up --build`. For host-based development, follow the
commands in the README and run PostgreSQL and Redis locally.

Never commit `.env` files, tokens, production data, generated media, virtual
environments, or dependency directories.

## Working agreement

1. Create a focused branch and keep unrelated changes out of the pull request.
2. Add tests for behavior changes and migrations for model changes.
3. Preserve organization scoping in every query and authorization path.
4. Keep API errors compatible with the standard response format.
5. Update the OpenAPI schema and relevant Markdown when contracts change.
6. Do not claim operational checklist items without verifiable evidence.

## Required checks

```bash
cd backend
python manage.py spectacular --file /tmp/clientflow-openapi.yml --validate
DJANGO_SETTINGS_MODULE=clientflow.settings.testing python manage.py makemigrations --check --dry-run
python -m pytest --cov=clientflow --cov-fail-under=70
pip-audit -r requirements.txt --no-deps --disable-pip --vulnerability-service osv
SECRET_KEY=release-check-secret DJANGO_SETTINGS_MODULE=clientflow.settings.testing python manage.py check_release

cd ../frontend
npm run lint
npm test -- --watchAll=false
npm run build
npm audit --omit=dev
```

If Docker is available, also run:

```bash
docker compose config --quiet
docker build -f backend/Dockerfile.prod backend
docker build -f frontend/Dockerfile.prod frontend
```

## Pull requests

Describe the user-visible outcome, implementation tradeoffs, data migrations,
security impact, and validation performed. Include screenshots for UI changes
and deployment/rollback notes for infrastructure-sensitive changes.

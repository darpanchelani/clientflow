# ClientFlow

ClientFlow is a full-stack client relationship and workflow application for
small teams. It combines lead and client management, projects, tasks, invoices,
payments, automation, analytics, and optional AI-assisted reporting in one
organization-scoped workspace.

The repository contains a React application, a Django REST/GraphQL backend,
Celery workers, PostgreSQL and Redis development services, production container
definitions, and automated CI checks. It is application-ready but is not a
claim that cloud infrastructure or third-party production accounts have been
provisioned.

## Features

- JWT registration, login, refresh, logout, and user profiles
- Organization-scoped leads, clients, projects, tasks, invoices, and payments
- Follow-ups, notifications, workflow automation, and scheduled Celery tasks
- Dashboards, revenue analytics, reports, and export flows
- Lead scoring, business insights, proposal generation, and optional OpenAI reports
- Authenticated REST and GraphQL APIs
- Interactive OpenAPI documentation and service health probes
- Lazy-loaded React routes with responsive Material UI screens
- Structured logs, request IDs, API throttling, and optional Sentry reporting

## Technology

| Area | Stack |
| --- | --- |
| Frontend | React 18, TypeScript, Redux Toolkit, Material UI, Axios, Recharts |
| Backend | Python 3.12, Django 5.2 LTS, Django REST Framework, Graphene |
| Data | PostgreSQL, Redis, Django ORM |
| Background work | Celery, django-celery-beat, django-celery-results |
| AI and data | OpenAI, scikit-learn, XGBoost, LightGBM, pandas |
| Delivery | Docker, Nginx, Gunicorn, GitHub Actions |

## Repository layout

```text
clientflow/
├── backend/                    Django API, GraphQL, workers, and tests
│   ├── clientflow/apps/        Domain applications
│   ├── clientflow/settings/    Development, testing, staging, and production
│   ├── Dockerfile              Development image
│   └── Dockerfile.prod         Gunicorn production image
├── frontend/                   React application and tests
│   ├── src/pages/              Route-level screens
│   ├── Dockerfile              Development image
│   └── Dockerfile.prod         Nginx production image
├── .github/workflows/ci.yml    Test, audit, schema, and container checks
└── docker-compose.yml          Local application stack
```

## Quick start with Docker

Prerequisites: Docker with Compose support.

```bash
cp .env.example .env
docker compose up --build
```

The backend container applies database migrations before starting. The stack
also starts PostgreSQL, Redis, a Celery worker, Celery Beat, and the frontend.

Open:

- Application: <http://localhost:3000>
- API root: <http://localhost:8000/api/>
- Swagger UI: <http://localhost:8000/api/docs/>
- ReDoc: <http://localhost:8000/api/redoc/>
- GraphQL: <http://localhost:8000/graphql/>
- Django admin: <http://localhost:8000/admin/>
- Liveness: <http://localhost:8000/health/live>
- Readiness: <http://localhost:8000/health/ready>

Stop the stack with:

```bash
docker compose down
```

Add `-v` only when you intentionally want to remove the local PostgreSQL
volume and its data.

## Local development

Prerequisites:

- Python 3.12
- Node.js 20 and npm
- PostgreSQL 14 or newer
- Redis 7 when running Celery workers; the Django development server itself
  uses an in-memory cache and does not require Redis

Start the data services:

```bash
cp .env.example .env
docker compose up -d db redis
```

Set up and start the backend:

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

In another terminal, start the frontend:

```bash
cd frontend
npm ci
npm start
```

The frontend uses `http://127.0.0.1:8000/api` by default. Override it with
`REACT_APP_API_URL` before starting the development server if needed.

To process asynchronous tasks locally, run these in separate backend terminals:

```bash
celery -A clientflow worker --loglevel=info
celery -A clientflow beat --loglevel=info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

## Configuration

Copy [backend/.env.example](backend/.env.example) to `backend/.env` for
host-based backend development. Important variables include:

| Variable | Purpose |
| --- | --- |
| `SECRET_KEY` | Django and JWT signing secret; must be unique in production |
| `DB_*` | PostgreSQL database connection |
| `REDIS_URL` | Shared production cache |
| `CELERY_BROKER_URL` | Celery broker connection |
| `CELERY_RESULT_BACKEND` | Celery result storage |
| `CORS_ALLOWED_ORIGINS` | Browser origins permitted to call the API |
| `OPENAI_API_KEY` | Enables OpenAI-backed report generation |
| `OPENAI_MODEL` | OpenAI model used by configured AI flows |
| `SENTRY_DSN` | Enables Sentry when present |
| `LOG_FORMAT` | Use `verbose` locally or `json` for structured logs |

Generated secrets and local `.env` files must not be committed.

## API and authentication

Authentication endpoints are available under `/api/auth/`:

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/profile
```

Protected REST requests use an access token:

```http
Authorization: Bearer <access-token>
```

The OpenAPI schema at `/api/schema/` is the source of truth for REST request
and response contracts. GraphQL requests at `/graphql/` use the same bearer
token and organization scoping.

## Tests and quality checks

Backend:

```bash
cd backend
python -m pytest --cov=clientflow --cov-fail-under=70
python manage.py spectacular --file /tmp/clientflow-openapi.yml --validate
DJANGO_SETTINGS_MODULE=clientflow.settings.testing python manage.py makemigrations --check --dry-run
SECRET_KEY=release-check-secret DJANGO_SETTINGS_MODULE=clientflow.settings.testing python manage.py check_release
pip-audit -r requirements.txt --no-deps --disable-pip --vulnerability-service osv
```

Frontend:

```bash
cd frontend
npm run lint
npm test -- --watchAll=false
npm run build
npm audit --omit=dev
```

The current suite contains 94 backend tests and 5 frontend utility tests. CI
runs these checks, validates migrations and the API schema, audits production
dependencies, and builds both production images.

## Production notes

- Use `clientflow.settings.production` or `clientflow.settings.staging`.
- Supply every required database, host, origin, and secret value through a
  managed secret store.
- Run `python manage.py check_release` before deployment.
- Use `backend/Dockerfile.prod` for Gunicorn and `frontend/Dockerfile.prod` for
  the Nginx-served frontend.
- Provide PostgreSQL, Redis, TLS termination, backups, monitoring, and alerting
  in the target environment.
- Run an independent security review and load test before serving production
  traffic. These operational controls are not created by this repository.

## Contributing and security

See [CONTRIBUTING.md](CONTRIBUTING.md) for the development workflow and required
checks. Report security issues using the private process in
[SECURITY.md](SECURITY.md).

## License

ClientFlow is available under the [MIT License](LICENSE).

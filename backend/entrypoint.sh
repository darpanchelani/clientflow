#!/bin/sh

set -eu

python <<'PY'
import os
import socket
import time

host = os.getenv('DB_HOST', 'localhost')
port = int(os.getenv('DB_PORT', '5432'))

for _ in range(60):
    try:
        with socket.create_connection((host, port), timeout=2):
            break
    except OSError:
        time.sleep(1)
else:
    raise SystemExit('Database is unavailable')
PY

python manage.py migrate --noinput

exec "$@"

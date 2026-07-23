# TUVTK Web

Dockerized Django development environment with two independent PostgreSQL 18 containers:

- `db_core` — Django users, authentication, administration, and operational application data.
- `db_registry` — the large ONRC company registry and related reference data.

The host directory `backend/` is bind-mounted to `/app` in the Django container. Source files always remain directly editable on the host.

## Requirements

- Linux or WSL
- Docker Engine
- Docker Compose v2
- Git
- Bash

## Initial setup

```bash
git clone git@github.com:cristake007/tuvtk-web.git
cd tuvtk-web
cp .env.example .env
chmod +x dev
```

Edit `.env` and replace the example Django secret and both database passwords. Useful generators:

```bash
openssl rand -base64 48
openssl rand -hex 24
```

Start the environment:

```bash
./dev up
./dev status
```

Create the core Django tables and an administrator:

```bash
./dev migrate
./dev admin-create
```

The development admin is available at:

```text
http://localhost:8000/admin/
```

Do not migrate Django authentication or administration tables into the registry database. The registry database remains empty until registry-specific models and a database router are added.

## Project structure

```text
.
├── Dockerfile
├── compose.yaml
├── dev
├── backend/
│   ├── apps/
│   ├── config/
│   ├── manage.py
│   └── requirements.txt
└── .env.example
```

Create local Django applications under `backend/apps/`:

```bash
./dev app users
./dev app audits
```

Register each app in `backend/config/settings.py` using its complete Python path, for example:

```python
"apps.users.apps.UsersConfig"
```

## Common commands

```bash
./dev help
./dev up
./dev down
./dev status
./dev logs backend
./dev check
./dev test
./dev migrations
./dev migrate
./dev shell
./dev admin-password admin
```

Database reset commands are destructive and request explicit confirmation:

```bash
./dev reset-core-db
./dev reset-registry-db
./dev reset-db
./dev wipe
```

These commands remove Docker state and database volumes, not the bind-mounted `backend/` source directory.

## Databases

Django aliases:

- `default` connects to `db_core`.
- `registry` connects to `db_registry`.

The core database owns normal Django and platform data. The registry database is reserved for ONRC records, CAEN data, company statuses, import metadata, and future enrichment data. Cross-database foreign keys are not used; core records should reference registry companies through stable identifiers such as CUI.

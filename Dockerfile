FROM python:3.14-slim-bookworm AS base

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apt-get update \
    && apt-get install --no-install-recommends -y \
        curl \
        libpq5 \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system app \
    && useradd --system --gid app --home-dir /app --no-create-home app

COPY backend/requirements.txt backend/requirements-dev.txt /tmp/

RUN pip install --upgrade pip \
    && pip install -r /tmp/requirements.txt

# This allows the image to run without a bind mount later.
# During development, ./backend:/app replaces this copy.
COPY --chown=app:app backend/ /app/

USER app

EXPOSE 8000

CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]


FROM base AS development

USER root

RUN pip install -r /tmp/requirements-dev.txt

USER app


FROM base AS production

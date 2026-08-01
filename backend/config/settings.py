import os
from pathlib import Path

from celery.schedules import crontab

BASE_DIR = Path(__file__).resolve().parent.parent


def env_bool(name: str, default: bool = False) -> bool:
    value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def env_list(name: str) -> list[str]:
    return [
        value.strip()
        for value in os.environ.get(name, "").split(",")
        if value.strip()
    ]


SECRET_KEY = os.environ["DJANGO_SECRET_KEY"]
DEBUG = env_bool("DJANGO_DEBUG")
ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS")
CSRF_TRUSTED_ORIGINS = env_list("DJANGO_CSRF_TRUSTED_ORIGINS")


INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "django_filters",
    "drf_spectacular",
    "drf_spectacular_sidecar",
    "apps.authentication.apps.AuthenticationConfig",
    "apps.core.apps.CoreConfig",
    "apps.tablou_de_bord.apps.TablouDeBordConfig",
    "apps.documente.apps.DocumenteConfig",
    "apps.companii.apps.CompaniiConfig",
    "apps.contacte.apps.ContacteConfig",
    "apps.oportunitati.apps.OportunitatiConfig",
    "apps.activitati.apps.ActivitatiConfig",
    "apps.firme_onrc.apps.FirmeOnrcConfig",
    "apps.course_planner.apps.CoursePlannerConfig",
    "apps.update_wordpress.apps.UpdateWordpressConfig",
    "apps.public_holidays.apps.PublicHolidaysConfig",
    "apps.utilizatori.apps.UtilizatoriConfig",
]


MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


ROOT_URLCONF = "config.urls"


TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    }
]


WSGI_APPLICATION = "config.wsgi.application"


DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ["CORE_DB_NAME"],
        "USER": os.environ["CORE_DB_USER"],
        "PASSWORD": os.environ["CORE_DB_PASSWORD"],
        "HOST": os.environ.get("CORE_DB_HOST", "db_core"),
        "PORT": os.environ.get("CORE_DB_PORT", "5432"),
        "CONN_MAX_AGE": 60,
        "CONN_HEALTH_CHECKS": True,
    },
}

registry_database = {
    "NAME": os.environ.get("REGISTRY_DB_NAME"),
    "USER": os.environ.get("REGISTRY_DB_USER"),
    "PASSWORD": os.environ.get("REGISTRY_DB_PASSWORD"),
}
if env_bool("REGISTRY_DB_ENABLED", default=True) and all(registry_database.values()):
    DATABASES["registry"] = {
        "ENGINE": "django.db.backends.postgresql",
        **registry_database,
        "HOST": os.environ.get("REGISTRY_DB_HOST", "db_registry"),
        "PORT": os.environ.get("REGISTRY_DB_PORT", "5432"),
        "CONN_MAX_AGE": 60,
        "CONN_HEALTH_CHECKS": True,
    }

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": os.environ.get("DJANGO_CACHE_URL", "redis://redis:6379/2"),
    }
}

OPENSEARCH_URL = os.environ.get("OPENSEARCH_URL", "")
OPENSEARCH_USERNAME = os.environ.get("OPENSEARCH_USERNAME", "")
OPENSEARCH_PASSWORD = os.environ.get("OPENSEARCH_PASSWORD", "")
OPENSEARCH_VERIFY_CERTS = env_bool("OPENSEARCH_VERIFY_CERTS", default=True)
OPENSEARCH_CA_CERTS = os.environ.get("OPENSEARCH_CA_CERTS") or None
OPENSEARCH_REQUEST_TIMEOUT = int(
    os.environ.get("OPENSEARCH_REQUEST_TIMEOUT", "5")
)
OPENSEARCH_FIRME_ONRC_ALIAS = os.environ.get(
    "OPENSEARCH_FIRME_ONRC_ALIAS",
    "firme-onrc-companies",
)
ONRC_DATA_DIR = Path(os.environ.get("ONRC_DATA_DIR", "/data/onrc"))

DATABASE_ROUTERS = ["config.database_routers.RegistryRouter"]


AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


LANGUAGE_CODE = "en-us"
TIME_ZONE = "Europe/Bucharest"
USE_I18N = True
USE_TZ = True


STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"


SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_SECURE = env_bool("DJANGO_SESSION_COOKIE_SECURE", default=not DEBUG)

# The React SPA reads the CSRF cookie and returns it in the X-CSRFToken header.
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SECURE = env_bool("DJANGO_CSRF_COOKIE_SECURE", default=not DEBUG)
CSRF_FAILURE_VIEW = "config.csrf.csrf_failure"

SECURE_SSL_REDIRECT = env_bool("DJANGO_SECURE_SSL_REDIRECT")
SECURE_HSTS_SECONDS = int(os.environ.get("DJANGO_SECURE_HSTS_SECONDS", "0"))
SECURE_HSTS_INCLUDE_SUBDOMAINS = env_bool("DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS")
SECURE_HSTS_PRELOAD = env_bool("DJANGO_SECURE_HSTS_PRELOAD")
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

if env_bool("DJANGO_TRUST_X_FORWARDED_PROTO"):
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

LOGIN_THROTTLE_LIMIT = int(os.environ.get("LOGIN_THROTTLE_LIMIT", "5"))
LOGIN_THROTTLE_WINDOW_SECONDS = int(
    os.environ.get("LOGIN_THROTTLE_WINDOW_SECONDS", "300")
)

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "apps.authentication.authentication.BrowserSessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "config.renderers.StandardizedJSONRenderer",
    ],
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

SPECTACULAR_SETTINGS = {
    "TITLE": "TUVTK API",
    "DESCRIPTION": "Internal API for the TUVTK operations platform.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "SERVE_PERMISSIONS": ["rest_framework.permissions.IsAdminUser"],
    "COMPONENT_SPLIT_REQUEST": True,
    "SCHEMA_PATH_PREFIX": r"/api/v1",
    "SWAGGER_UI_DIST": "SIDECAR",
    "SWAGGER_UI_FAVICON_HREF": "SIDECAR",
    "REDOC_DIST": "SIDECAR",
}

CELERY_BROKER_URL = os.environ.get(
    "CELERY_BROKER_URL",
    "redis://redis:6379/0",
)
CELERY_RESULT_BACKEND = os.environ.get(
    "CELERY_RESULT_BACKEND",
    "redis://redis:6379/1",
)
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE
CELERY_ENABLE_UTC = True
CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_SOFT_TIME_LIMIT = 90
CELERY_TASK_TIME_LIMIT = 120
CELERY_RESULT_EXPIRES = 86_400
CELERY_BEAT_SCHEDULE = {
    "public-holidays-sync-due-check": {
        "task": "public_holidays.sync_if_due",
        "schedule": crontab(hour=3, minute=15),
    },
}


DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

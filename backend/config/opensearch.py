from functools import lru_cache
from urllib.parse import urlparse

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from opensearchpy import OpenSearch


@lru_cache(maxsize=1)
def get_opensearch_client() -> OpenSearch:
    parsed_url = urlparse(settings.OPENSEARCH_URL)
    if parsed_url.scheme not in {"http", "https"} or not parsed_url.hostname:
        raise ImproperlyConfigured("OPENSEARCH_URL must be a valid HTTP or HTTPS URL.")

    has_username = bool(settings.OPENSEARCH_USERNAME)
    has_password = bool(settings.OPENSEARCH_PASSWORD)
    if has_username != has_password:
        raise ImproperlyConfigured(
            "OPENSEARCH_USERNAME and OPENSEARCH_PASSWORD must be configured together."
        )

    http_auth = None
    if has_username:
        http_auth = (settings.OPENSEARCH_USERNAME, settings.OPENSEARCH_PASSWORD)

    use_ssl = parsed_url.scheme == "https"
    verify_certs = use_ssl and settings.OPENSEARCH_VERIFY_CERTS

    return OpenSearch(
        hosts=[
            {
                "host": parsed_url.hostname,
                "port": parsed_url.port or (443 if use_ssl else 80),
            }
        ],
        http_auth=http_auth,
        http_compress=True,
        timeout=settings.OPENSEARCH_REQUEST_TIMEOUT,
        use_ssl=use_ssl,
        verify_certs=verify_certs,
        ca_certs=settings.OPENSEARCH_CA_CERTS,
        ssl_assert_hostname=verify_certs,
        ssl_show_warn=False,
    )

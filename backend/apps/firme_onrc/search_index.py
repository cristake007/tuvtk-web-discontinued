from collections import defaultdict
from collections.abc import Iterator, Sequence
from datetime import datetime
from itertools import islice

from django.conf import settings
from django.db import connections
from opensearchpy import OpenSearch, helpers

from config.opensearch import get_opensearch_client

from .models import Company, OnrcSnapshot

DATABASE_ALIAS = "registry"
INDEX_BATCH_SIZE = 2_000
INDEX_ADMIN_TIMEOUT = 600

COMPANY_COLUMNS = (
    "id",
    "name",
    "cui",
    "registration_number",
    "registered_at",
    "euid",
    "legal_form",
    "country",
    "county",
    "locality",
    "street",
    "street_number",
    "building",
    "staircase",
    "floor",
    "apartment",
    "postal_code",
    "sector",
    "address_details",
    "website",
    "parent_company_country",
)


def index_name(snapshot: OnrcSnapshot) -> str:
    return (
        f"{settings.OPENSEARCH_FIRME_ONRC_ALIAS}-"
        f"{snapshot.snapshot_date:%Y%m%d}-{snapshot.pk}"
    )


def index_definition() -> dict:
    return {
        "settings": {
            "index": {
                "number_of_shards": 3,
                "number_of_replicas": 0,
                "refresh_interval": "-1",
            },
            "analysis": {
                "normalizer": {
                    "folded_keyword": {
                        "type": "custom",
                        "filter": ["lowercase", "asciifolding"],
                    }
                }
            },
        },
        "mappings": {
            "dynamic": "strict",
            "properties": {
                "id": {"type": "long"},
                "name": {
                    "type": "text",
                    "analyzer": "romanian",
                    "fields": {
                        "keyword": {
                            "type": "keyword",
                            "normalizer": "folded_keyword",
                        }
                    },
                },
                "cui": {"type": "keyword"},
                "registration_number": {
                    "type": "keyword",
                    "normalizer": "folded_keyword",
                },
                "registered_at": {"type": "date"},
                "euid": {
                    "type": "keyword",
                    "normalizer": "folded_keyword",
                },
                "legal_form": {"type": "keyword"},
                "country": {"type": "keyword"},
                "county": {
                    "type": "keyword",
                    "normalizer": "folded_keyword",
                },
                "locality": {
                    "type": "keyword",
                    "normalizer": "folded_keyword",
                },
                "street": {"type": "text", "analyzer": "romanian"},
                "street_number": {"type": "keyword"},
                "building": {"type": "keyword"},
                "staircase": {"type": "keyword"},
                "floor": {"type": "keyword"},
                "apartment": {"type": "keyword"},
                "postal_code": {"type": "keyword"},
                "sector": {"type": "keyword"},
                "address_details": {"type": "text", "analyzer": "romanian"},
                "website": {"type": "keyword"},
                "parent_company_country": {"type": "keyword"},
                "caen_codes": {"type": "keyword"},
                "status_codes": {"type": "keyword"},
            },
        },
    }


def _related_values(
    *,
    snapshot_id: int,
    registration_numbers: Sequence[str],
    table: str,
    value_column: str,
) -> dict[str, list[str]]:
    numbers = [value for value in registration_numbers if value]
    if not numbers:
        return {}

    values: dict[str, list[str]] = defaultdict(list)
    with connections[DATABASE_ALIAS].cursor() as cursor:
        cursor.execute(
            f"""
            SELECT registration_number, {value_column}
            FROM {table}
            WHERE snapshot_id = %s
              AND registration_number = ANY(%s)
            ORDER BY registration_number, source_row_number
            """,
            [snapshot_id, numbers],
        )
        for registration_number, value in cursor.fetchall():
            if value not in values[registration_number]:
                values[registration_number].append(value)
    return values


def _company_batches(snapshot_id: int) -> Iterator[list[dict]]:
    companies = (
        Company.objects.using(DATABASE_ALIAS)
        .filter(snapshot_id=snapshot_id)
        .order_by("id")
        .values(*COMPANY_COLUMNS)
        .iterator(chunk_size=INDEX_BATCH_SIZE)
    )
    while batch := list(islice(companies, INDEX_BATCH_SIZE)):
        yield batch


def _documents(snapshot: OnrcSnapshot, target_index: str) -> Iterator[dict]:
    for companies in _company_batches(snapshot.pk):
        registration_numbers = [
            company["registration_number"] for company in companies
        ]
        caen_by_registration = _related_values(
            snapshot_id=snapshot.pk,
            registration_numbers=registration_numbers,
            table="onrc_authorized_caen",
            value_column="caen_code",
        )
        status_by_registration = _related_values(
            snapshot_id=snapshot.pk,
            registration_numbers=registration_numbers,
            table="onrc_company_status",
            value_column="status_code",
        )

        for company in companies:
            registered_at = company["registered_at"]
            if isinstance(registered_at, datetime):
                company["registered_at"] = registered_at.isoformat()
            registration_number = company["registration_number"]
            company["caen_codes"] = caen_by_registration.get(
                registration_number,
                [],
            )
            company["status_codes"] = status_by_registration.get(
                registration_number,
                [],
            )
            yield {
                "_index": target_index,
                "_id": company["id"],
                "_source": company,
            }


def _activate_index(client: OpenSearch, target_index: str) -> None:
    alias = settings.OPENSEARCH_FIRME_ONRC_ALIAS
    actions = []
    if client.indices.exists_alias(name=alias):
        actions.extend(
            {
                "remove": {
                    "index": current,
                    "alias": alias,
                }
            }
            for current in client.indices.get_alias(name=alias)
        )
    actions.append({"add": {"index": target_index, "alias": alias}})
    client.indices.update_aliases(
        body={"actions": actions},
        request_timeout=INDEX_ADMIN_TIMEOUT,
    )


def build_company_index(snapshot: OnrcSnapshot) -> tuple[str, int]:
    if snapshot.status != OnrcSnapshot.Status.ACTIVE:
        raise ValueError("Poate fi indexat numai snapshotul ONRC activ.")

    client = get_opensearch_client()
    target_index = index_name(snapshot)
    if client.indices.exists(index=target_index):
        raise ValueError(f"Indexul OpenSearch {target_index} există deja.")

    client.indices.create(
        index=target_index,
        body=index_definition(),
        request_timeout=INDEX_ADMIN_TIMEOUT,
    )
    try:
        success_count, errors = helpers.bulk(
            client,
            _documents(snapshot, target_index),
            chunk_size=INDEX_BATCH_SIZE,
            max_chunk_bytes=20 * 1024 * 1024,
            request_timeout=120,
            raise_on_error=False,
            raise_on_exception=True,
        )
        if errors:
            raise RuntimeError(
                f"OpenSearch a respins {len(errors)} documente."
            )
        client.indices.put_settings(
            index=target_index,
            body={"index": {"refresh_interval": "30s"}},
            request_timeout=INDEX_ADMIN_TIMEOUT,
        )
        client.indices.refresh(
            index=target_index,
            request_timeout=INDEX_ADMIN_TIMEOUT,
        )
        indexed_count = int(
            client.count(
                index=target_index,
                request_timeout=INDEX_ADMIN_TIMEOUT,
            )["count"]
        )
        if indexed_count != snapshot.company_count or success_count != indexed_count:
            raise RuntimeError(
                "Numărul documentelor OpenSearch nu corespunde snapshotului: "
                f"{indexed_count} indexate, {snapshot.company_count} așteptate."
            )
        _activate_index(client, target_index)
        return target_index, indexed_count
    except Exception:
        client.indices.delete(
            index=target_index,
            ignore_unavailable=True,
            request_timeout=INDEX_ADMIN_TIMEOUT,
        )
        raise

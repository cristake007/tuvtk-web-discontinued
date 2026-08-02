import logging

from celery import shared_task

from .services import sync_public_holidays_if_due

logger = logging.getLogger(__name__)


@shared_task(
    name="public_holidays.sync_if_due",
    autoretry_for=(Exception,),
    retry_backoff=True,
    max_retries=3,
)
def sync_public_holidays_task() -> dict[str, object]:
    result = sync_public_holidays_if_due()
    if result.status == "failed":
        logger.error("Nager.Date synchronization failed: %s", result.message)
        raise RuntimeError(result.message)
    if result.status == "success":
        logger.info("Nager.Date synchronization completed: %s", result.message)
    else:
        logger.info("Nager.Date synchronization skipped: %s", result.message)
    return result.to_dict()

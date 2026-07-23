from django.http import HttpRequest
from ninja import Router

from .schemas import CoreBootstrapSchema
from .services import get_core_bootstrap


router = Router(tags=["core"])


@router.get(
    "/bootstrap",
    auth=None,
    response=CoreBootstrapSchema,
    summary="Return application shell configuration and navigation",
)
def core_bootstrap(request: HttpRequest) -> dict[str, object]:
    return get_core_bootstrap(request)

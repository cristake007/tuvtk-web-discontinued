from rest_framework.permissions import BasePermission

from .services import user_has_application_access


class HasApplicationAccess(BasePermission):
    message = "Nu aveți acces la această aplicație."

    def has_permission(self, request, view) -> bool:
        application_key = getattr(view, "application_key", None)
        return bool(
            application_key
            and user_has_application_access(request.user, application_key)
        )

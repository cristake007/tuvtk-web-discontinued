from rest_framework.permissions import BasePermission


class CanUseCoursePlanner(BasePermission):
    message = "Nu aveți permisiunea de a utiliza planificatorul de cursuri."

    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.has_perm("course_planner.use_course_planner")
        )

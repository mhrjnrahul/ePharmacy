from rest_framework.permissions import BasePermission
from core.models import Role


class IsAdminUser(BasePermission):
    def has_permission(self, request, view):
        return request.user.role == Role.ADMIN

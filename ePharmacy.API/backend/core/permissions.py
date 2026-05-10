from rest_framework.permissions import BasePermission, SAFE_METHODS
from core.models import Role


class IsAdminUser(BasePermission):
    """Only admin role. Use for: creating staff, deleting/restoring users."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == Role.ADMIN
        )


class IsAdminOrStaff(BasePermission):
    """Admin or staff. Use for: dashboard, inventory, sales management."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in (Role.ADMIN, Role.STAFF)
        )


class IsOwnerOrAdminOrStaff(BasePermission):
    """
    Object-level permission.
    Owner can access their own object. Admin/staff can access any.

    Set `owner_field` on the view to specify which field points to the owner.
    Defaults to 'user'.

    Usage:
        class OrderDetailView(RetrieveAPIView):
            permission_classes = [IsAuthenticated, IsOwnerOrAdminOrStaff]
            owner_field = 'user'
    """

    def has_object_permission(self, request, view, obj):
        if request.user.role in (Role.ADMIN, Role.STAFF):
            return True

        owner_field = getattr(view, "owner_field", "user")
        owner = getattr(obj, owner_field, None)

        if owner is None:
            return False

        if hasattr(owner, "pk"):
            return owner.pk == request.user.pk
        return owner == request.user.pk


class IsAdminOrStaffOrReadOnly(BasePermission):
    """
    Admin/staff can do anything.
    Unauthenticated or customer users can only read (GET, HEAD, OPTIONS).

    Use for: Medicine list/detail — anyone can browse, only staff can add/edit.
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in (Role.ADMIN, Role.STAFF)
        )

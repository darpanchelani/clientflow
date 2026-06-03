from functools import wraps

from django.http import JsonResponse
from rest_framework.permissions import BasePermission


class HasRolePermission(BasePermission):
    allowed_roles = ()

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (not self.allowed_roles or getattr(user, 'role', None) in self.allowed_roles)
        )


class IsAdminRole(HasRolePermission):
    allowed_roles = ('admin',)


class IsManagerRole(HasRolePermission):
    allowed_roles = ('manager',)


class IsAdminOrManager(HasRolePermission):
    allowed_roles = ('admin', 'manager')


def role_required(*roles):
    def decorator(view_func):
        @wraps(view_func)
        def wrapped(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return JsonResponse({'detail': 'Authentication required.'}, status=401)
            if roles and getattr(request.user, 'role', None) not in roles:
                return JsonResponse({'detail': 'Permission denied.'}, status=403)
            return view_func(request, *args, **kwargs)

        return wrapped

    return decorator

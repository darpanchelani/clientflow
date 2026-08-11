from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.authentication import JWTAuthentication


class JWTAuthenticationMiddleware:
    """Authenticate GraphQL requests with the same Bearer token as the REST API."""

    def resolve(self, next_, root, info, **kwargs):
        request = info.context
        if not getattr(request, "_graphql_jwt_checked", False):
            request._graphql_jwt_checked = True
            authenticated = JWTAuthentication().authenticate(request)
            if authenticated:
                request.user, request.auth = authenticated
            elif not hasattr(request, "user"):
                request.user = AnonymousUser()
        return next_(root, info, **kwargs)

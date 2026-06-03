class RoleMiddleware:
    """
    Attach the authenticated user's role to the request.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        user = getattr(request, 'user', None)
        request.user_role = getattr(user, 'role', None) if user and user.is_authenticated else None
        request.role = request.user_role
        request.is_admin_role = request.user_role == 'admin'
        request.is_manager_role = request.user_role == 'manager'
        return self.get_response(request)

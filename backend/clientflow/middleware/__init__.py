"""
Custom middleware for audit logging and request tracking
"""
import json
import logging
import uuid
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger('clientflow.audit')


class AuditMiddleware(MiddlewareMixin):
    """
    Middleware to log all API requests for audit trail
    """
    
    def process_request(self, request):
        """Add request ID and timestamp"""
        request.id = str(uuid.uuid4())
        request.META['HTTP_X_REQUEST_ID'] = request.id
        return None
    
    def process_response(self, request, response):
        """Log request/response details"""
        if request.path.startswith('/api/'):
            log_data = {
                'request_id': getattr(request, 'id', 'N/A'),
                'method': request.method,
                'path': request.path,
                'status_code': response.status_code,
                'user': getattr(request.user, 'id', 'anonymous'),
            }
            
            if hasattr(request, 'user') and request.user.is_authenticated:
                log_data['user_email'] = request.user.email
            
            logger.info(json.dumps(log_data))
        
        return response


class OrganizationMiddleware(MiddlewareMixin):
    """
    Middleware to extract and attach organization from request
    """
    
    def process_request(self, request):
        """
        Extract organization from JWT token or session
        This ensures multi-tenant isolation
        """
        if hasattr(request, 'user') and request.user.is_authenticated:
            # Get organization from user profile or organization member
            try:
                from clientflow.apps.users.models import User
                user = User.objects.get(id=request.user.id)
                request.organization = user.organization
            except Exception:
                request.organization = None
        
        return None

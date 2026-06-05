"""
Custom exception handler for API responses
"""
from rest_framework.views import exception_handler as drf_exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


def _extract_error_message(data):
    if isinstance(data, dict):
        if 'detail' in data:
            return data['detail']
        if 'non_field_errors' in data:
            value = data['non_field_errors']
            if isinstance(value, list) and value:
                return value[0]
            return value
        for value in data.values():
            if isinstance(value, list) and value:
                first = value[0]
                if isinstance(first, str):
                    return first
            if isinstance(value, str):
                return value
        return 'An error occurred'
    if isinstance(data, list) and data:
        first = data[0]
        if isinstance(first, dict):
            return _extract_error_message(first)
        return first
    if isinstance(data, str):
        return data
    return 'An error occurred'


def custom_exception_handler(exc, context):
    """
    Custom exception handler for consistent error response format
    """
    response = drf_exception_handler(exc, context)
    
    if response is None:
        # Log unhandled exceptions
        logger.error(f'Unhandled exception: {exc}', exc_info=True)
        return Response(
            {
                'error': 'Internal server error',
                'code': 'INTERNAL_SERVER_ERROR',
                'status_code': 500,
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    # Format the response
    exc_class = exc.__class__.__name__
    error_message = _extract_error_message(response.data)

    formatted_response = {
        'error': error_message,
        'code': exc_class,
        'status_code': response.status_code,
    }
    
    # Add field errors for validation errors
    if isinstance(response.data, dict) and 'detail' not in response.data:
        formatted_response['fields'] = response.data
    elif isinstance(response.data, list):
        formatted_response['fields'] = response.data

    response.data = formatted_response
    return response

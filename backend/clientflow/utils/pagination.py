"""
Custom pagination for cursor-based pagination
"""
from rest_framework.pagination import CursorPagination as BaseCursorPagination


class CursorPagination(BaseCursorPagination):
    """
    Custom cursor pagination with configurable page size
    """
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 100
    ordering = '-created_at'

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from clientflow.apps.crm.utils import get_scope_key

from .models import User
from .serializers import UserProfileSerializer


class UserListView(generics.ListAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        scope = get_scope_key(self.request.user)
        queryset = User.objects.all()
        if scope:
            queryset = queryset.filter(organization_name=scope)
        else:
            queryset = queryset.filter(pk=self.request.user.pk)
        return queryset.order_by('first_name', 'email')


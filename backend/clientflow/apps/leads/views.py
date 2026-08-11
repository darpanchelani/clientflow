from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from clientflow.apps.crm.models import Activity
from clientflow.apps.crm.serializers import NoteCreateSerializer, NoteSerializer
from clientflow.apps.crm.utils import add_note, get_scope_key, log_activity, serialize_timeline

from .filters import LeadFilter
from .models import Lead
from .serializers import LeadSerializer, LeadStatusSerializer


class LeadViewSet(viewsets.ModelViewSet):
    serializer_class = LeadSerializer
    permission_classes = [IsAuthenticated]
    filterset_class = LeadFilter
    search_fields = ['name', 'email', 'phone', 'company']
    ordering_fields = ['created_at', 'updated_at', 'score', 'name', 'status', 'source']
    ordering = ['-created_at']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Lead.objects.none()
        user = self.request.user
        scope = get_scope_key(user)
        queryset = Lead.objects.select_related('owner').prefetch_related('tags')
        if scope:
            return queryset.filter(organization_name=scope)
        return queryset.filter(owner=user)

    @transaction.atomic
    def perform_create(self, serializer):
        lead = serializer.save(
            owner=self.request.user,
            organization_name=get_scope_key(self.request.user),
        )
        log_activity(
            target=lead,
            action=Activity.Action.CREATED,
            actor=self.request.user,
            message='Lead created',
            metadata={'lead_id': lead.pk},
        )

    @transaction.atomic
    def perform_update(self, serializer):
        lead = self.get_object()
        old_status = lead.status
        lead = serializer.save()
        action = Activity.Action.STATUS_CHANGED if old_status != lead.status else Activity.Action.UPDATED
        log_activity(
            target=lead,
            action=action,
            actor=self.request.user,
            message='Lead status updated' if action == Activity.Action.STATUS_CHANGED else 'Lead updated',
            metadata={
                'lead_id': lead.pk,
                'previous_status': old_status,
                'current_status': lead.status,
            },
        )

    @transaction.atomic
    def perform_destroy(self, instance):
        log_activity(
            target=instance,
            action=Activity.Action.DELETED,
            actor=self.request.user,
            message='Lead deleted',
            metadata={'lead_id': instance.pk},
        )
        instance.delete()

    @action(detail=True, methods=['patch'], url_path='status')
    def update_status(self, request, pk=None):
        lead = self.get_object()
        serializer = LeadStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        previous_status = lead.status
        lead.status = serializer.validated_data['status']
        lead.save(update_fields=['status', 'updated_at'])
        log_activity(
            target=lead,
            action=Activity.Action.STATUS_CHANGED,
            actor=request.user,
            message='Lead status changed',
            metadata={
                'lead_id': lead.pk,
                'previous_status': previous_status,
                'current_status': lead.status,
            },
        )
        return Response(self.get_serializer(lead).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get', 'post'])
    def notes(self, request, pk=None):
        lead = self.get_object()
        if request.method == 'GET':
            serializer = NoteSerializer(lead.notes.all(), many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        serializer = NoteCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        note = add_note(target=lead, body=serializer.validated_data['body'], author=request.user)
        return Response(NoteSerializer(note).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def timeline(self, request, pk=None):
        lead = self.get_object()
        return Response(serialize_timeline(lead), status=status.HTTP_200_OK)

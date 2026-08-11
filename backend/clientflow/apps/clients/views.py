from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from clientflow.apps.crm.models import Activity
from clientflow.apps.crm.serializers import NoteCreateSerializer, NoteSerializer
from clientflow.apps.crm.utils import add_note, get_scope_key, log_activity, serialize_timeline
from clientflow.apps.leads.models import Lead

from .filters import ClientFilter
from .models import Client
from .serializers import ClientSerializer, ClientStatusSerializer


class ClientViewSet(viewsets.ModelViewSet):
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]
    filterset_class = ClientFilter
    search_fields = ['name', 'email', 'phone', 'company']
    ordering_fields = ['created_at', 'updated_at', 'name', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Client.objects.none()
        user = self.request.user
        scope = get_scope_key(user)
        queryset = Client.objects.select_related('owner', 'lead').prefetch_related('tags')
        if scope:
            return queryset.filter(organization_name=scope)
        return queryset.filter(owner=user)

    @transaction.atomic
    def perform_create(self, serializer):
        client = serializer.save(
            owner=self.request.user,
            organization_name=get_scope_key(self.request.user),
        )
        log_activity(
            target=client,
            action=Activity.Action.CREATED,
            actor=self.request.user,
            message='Client created',
            metadata={'client_id': client.pk},
        )

        if client.lead_id:
            lead = client.lead
            if lead.organization_name == client.organization_name and lead.status != Lead.Status.WON:
                previous_status = lead.status
                lead.status = Lead.Status.WON
                lead.save(update_fields=['status', 'updated_at'])
                log_activity(
                    target=lead,
                    action=Activity.Action.CONVERTED,
                    actor=self.request.user,
                    message='Lead converted to client',
                    metadata={
                        'lead_id': lead.pk,
                        'client_id': client.pk,
                        'previous_status': previous_status,
                    },
                )

    @transaction.atomic
    def perform_update(self, serializer):
        client = self.get_object()
        old_lead = client.lead
        client = serializer.save()
        log_activity(
            target=client,
            action=Activity.Action.UPDATED,
            actor=self.request.user,
            message='Client updated',
            metadata={'client_id': client.pk},
        )
        if client.lead and client.lead != old_lead:
            lead = client.lead
            if lead.organization_name == client.organization_name and lead.status != Lead.Status.WON:
                previous_status = lead.status
                lead.status = Lead.Status.WON
                lead.save(update_fields=['status', 'updated_at'])
                log_activity(
                    target=lead,
                    action=Activity.Action.CONVERTED,
                    actor=self.request.user,
                    message='Lead converted to client',
                    metadata={
                        'lead_id': lead.pk,
                        'client_id': client.pk,
                        'previous_status': previous_status,
                    },
                )

    @transaction.atomic
    def perform_destroy(self, instance):
        log_activity(
            target=instance,
            action=Activity.Action.DELETED,
            actor=self.request.user,
            message='Client deleted',
            metadata={'client_id': instance.pk},
        )
        instance.delete()

    @action(detail=True, methods=['get', 'post'])
    def notes(self, request, pk=None):
        client = self.get_object()
        if request.method == 'GET':
            serializer = NoteSerializer(client.notes.all(), many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        serializer = NoteCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        note = add_note(target=client, body=serializer.validated_data['body'], author=request.user)
        return Response(NoteSerializer(note).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def timeline(self, request, pk=None):
        client = self.get_object()
        return Response(serialize_timeline(client), status=status.HTTP_200_OK)

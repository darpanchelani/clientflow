from django.db import transaction
from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from clientflow.apps.crm.models import Activity
from clientflow.apps.crm.utils import get_scope_key, log_activity
from clientflow.apps.notifications.utils import create_billing_notification

from .filters import InvoiceFilter
from .models import Invoice
from .serializers import (
    InvoiceSendSerializer,
    InvoiceSerializer,
    InvoiceStatusSerializer,
    PaymentSummarySerializer,
)
from .utils import finalize_invoice_payment, mark_overdue_invoices


class InvoiceViewSet(viewsets.ModelViewSet):
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]
    filterset_class = InvoiceFilter
    search_fields = ['invoice_number', 'client__name', 'client__company', 'notes']
    ordering_fields = ['created_at', 'updated_at', 'issue_date', 'due_date', 'total', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        scope = get_scope_key(user)
        queryset = Invoice.objects.select_related('client', 'project', 'owner', 'client__lead').prefetch_related('items', 'payments')
        if scope:
            queryset = queryset.filter(Q(owner=user) | Q(organization_name=scope))
        else:
            queryset = queryset.filter(owner=user)
        mark_overdue_invoices(queryset=queryset)
        return queryset

    @transaction.atomic
    def perform_create(self, serializer):
        invoice = serializer.save(
            owner=self.request.user,
            organization_name=get_scope_key(self.request.user),
        )
        log_activity(
            target=invoice,
            action=Activity.Action.CREATED,
            actor=self.request.user,
            message='Invoice created',
            metadata={'invoice_id': invoice.pk},
        )

    @transaction.atomic
    def perform_update(self, serializer):
        invoice = self.get_object()
        old_status = invoice.status
        invoice = serializer.save()
        log_activity(
            target=invoice,
            action=Activity.Action.UPDATED,
            actor=self.request.user,
            message='Invoice updated',
            metadata={'invoice_id': invoice.pk, 'previous_status': old_status, 'current_status': invoice.status},
        )

    @transaction.atomic
    def perform_destroy(self, instance):
        log_activity(
            target=instance,
            action=Activity.Action.DELETED,
            actor=self.request.user,
            message='Invoice deleted',
            metadata={'invoice_id': instance.pk},
        )
        instance.delete()

    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        invoice = self.get_object()
        serializer = InvoiceSendSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if invoice.status != Invoice.Status.DRAFT and not getattr(request.user, 'is_admin_role', False):
            return Response({'detail': 'Only draft invoices can be sent.'}, status=status.HTTP_400_BAD_REQUEST)
        if invoice.items.count() == 0:
            return Response({'detail': 'Invoice must contain at least one item.'}, status=status.HTTP_400_BAD_REQUEST)
        invoice.status = Invoice.Status.SENT
        invoice.save(update_fields=['status', 'updated_at'])
        create_billing_notification(
            user=invoice.owner,
            title='Invoice sent',
            message=f'Invoice {invoice.invoice_number} has been sent.',
        )
        log_activity(
            target=invoice,
            action=Activity.Action.STATUS_CHANGED,
            actor=request.user,
            message='Invoice sent',
            metadata={'invoice_id': invoice.pk, 'current_status': invoice.status},
        )
        return Response(self.get_serializer(invoice).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['patch'], url_path='status')
    def update_status(self, request, pk=None):
        invoice = self.get_object()
        serializer = InvoiceStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if invoice.status != Invoice.Status.DRAFT and not getattr(request.user, 'is_admin_role', False):
            return Response({'detail': 'Only admins can modify sent invoices.'}, status=status.HTTP_400_BAD_REQUEST)
        previous_status = invoice.status
        if serializer.validated_data['status'] == Invoice.Status.PAID and invoice.balance_due > 0:
            return Response({'detail': 'Invoice cannot be marked paid until the balance is zero.'}, status=status.HTTP_400_BAD_REQUEST)
        invoice.status = serializer.validated_data['status']
        invoice.save(update_fields=['status', 'updated_at'])
        if invoice.status == Invoice.Status.PAID:
            finalize_invoice_payment(invoice)
        log_activity(
            target=invoice,
            action=Activity.Action.STATUS_CHANGED,
            actor=request.user,
            message='Invoice status changed',
            metadata={'invoice_id': invoice.pk, 'previous_status': previous_status, 'current_status': invoice.status},
        )
        return Response(self.get_serializer(invoice).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def payments(self, request, pk=None):
        invoice = self.get_object()
        payments = invoice.payments.order_by('-created_at')
        return Response(PaymentSummarySerializer(payments, many=True).data, status=status.HTTP_200_OK)

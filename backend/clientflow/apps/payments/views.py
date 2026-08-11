from django.db import transaction
from django.db.models import Q
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from clientflow.apps.crm.models import Activity
from clientflow.apps.crm.utils import get_scope_key, log_activity
from clientflow.apps.invoices.models import Invoice
from clientflow.apps.invoices.utils import finalize_invoice_payment

from .models import Payment
from .serializers import PaymentSerializer, PaymentVerifySerializer


class PaymentViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ['transaction_id', 'invoice__invoice_number', 'invoice__client__name']
    ordering_fields = ['created_at', 'updated_at', 'paid_at', 'amount', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Payment.objects.none()
        user = self.request.user
        scope = get_scope_key(user)
        queryset = Payment.objects.select_related('invoice', 'invoice__client', 'created_by').all()
        if scope:
            queryset = queryset.filter(Q(invoice__owner=user) | Q(invoice__organization_name=scope))
        else:
            queryset = queryset.filter(invoice__owner=user)
        return queryset

    @transaction.atomic
    def perform_create(self, serializer):
        payment = serializer.save()
        log_activity(
            target=payment.invoice,
            action=Activity.Action.CREATED,
            actor=self.request.user,
            message='Payment created',
            metadata={'payment_id': payment.pk, 'invoice_id': payment.invoice_id},
        )

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        payment = self.get_object()
        serializer = PaymentVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if payment.invoice.status == Invoice.Status.PAID:
            return Response({'detail': 'Invoice has already been paid.'}, status=status.HTTP_400_BAD_REQUEST)

        outstanding = payment.invoice.balance_due
        if payment.status == Payment.Status.COMPLETED:
            return Response(self.get_serializer(payment).data, status=status.HTTP_200_OK)
        if payment.amount > outstanding:
            return Response({'amount': ['Payment amount cannot exceed the outstanding balance.']}, status=status.HTTP_400_BAD_REQUEST)

        payment.status = Payment.Status.COMPLETED
        if serializer.validated_data.get('transaction_id'):
            payment.transaction_id = serializer.validated_data['transaction_id']
        payment.save(update_fields=['status', 'transaction_id', 'updated_at'])
        payment.mark_completed()
        finalize_invoice_payment(payment.invoice)
        log_activity(
            target=payment.invoice,
            action=Activity.Action.STATUS_CHANGED,
            actor=request.user,
            message='Payment verified',
            metadata={'payment_id': payment.pk, 'invoice_id': payment.invoice_id},
        )
        return Response(self.get_serializer(payment).data, status=status.HTTP_200_OK)

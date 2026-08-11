from decimal import Decimal

from django.db.models import Sum
from rest_framework import serializers

from clientflow.apps.invoices.models import Invoice
from clientflow.apps.invoices.serializers import InvoiceSummarySerializer
from clientflow.apps.invoices.utils import finalize_invoice_payment
from clientflow.apps.notifications.utils import create_billing_notification

from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    invoice = InvoiceSummarySerializer(read_only=True)
    invoice_id = serializers.PrimaryKeyRelatedField(
        source='invoice',
        queryset=Invoice.objects.all(),
        write_only=True,
    )
    balance_after_payment = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = (
            'id',
            'invoice',
            'invoice_id',
            'amount',
            'payment_method',
            'transaction_id',
            'status',
            'paid_at',
            'balance_after_payment',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'invoice', 'paid_at', 'balance_after_payment', 'created_at', 'updated_at')

    def get_balance_after_payment(self, obj) -> Decimal:
        completed_total = obj.invoice.payments.filter(status=Payment.Status.COMPLETED).aggregate(total=Sum('amount')).get('total') or Decimal('0.00')
        if obj.status == Payment.Status.COMPLETED:
            completed_total = completed_total
        return max(obj.invoice.total - completed_total, Decimal('0.00'))

    def validate(self, attrs):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        invoice = attrs.get('invoice') or getattr(self.instance, 'invoice', None)
        amount = attrs.get('amount') or getattr(self.instance, 'amount', None)

        if amount is not None and amount < 0:
            raise serializers.ValidationError({'amount': 'Amount cannot be negative.'})

        if invoice is not None:
            if invoice.status == Invoice.Status.PAID:
                raise serializers.ValidationError({'invoice_id': 'Invoice has already been paid.'})
            if invoice.status == Invoice.Status.CANCELLED:
                raise serializers.ValidationError({'invoice_id': 'Cancelled invoices cannot receive payments.'})

            outstanding = invoice.balance_due
            if self.instance and self.instance.status == Payment.Status.COMPLETED:
                outstanding += self.instance.amount

            if amount is not None and amount > outstanding:
                raise serializers.ValidationError({'amount': 'Payment amount cannot exceed the outstanding balance.'})

            if invoice.organization_name and user is not None:
                scope = getattr(user, 'organization_name', '') or getattr(user, 'email', '')
                if invoice.organization_name != scope:
                    raise serializers.ValidationError({'invoice_id': 'Invoice does not belong to your organization.'})

        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        payment = Payment.objects.create(created_by=user, **validated_data)
        if payment.status == Payment.Status.COMPLETED:
            self._complete_payment(payment)
        return payment

    def update(self, instance, validated_data):
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        if instance.status == Payment.Status.COMPLETED:
            self._complete_payment(instance)
        return instance

    def _complete_payment(self, payment):
        if not payment.transaction_id:
            payment.transaction_id = f'MOCK-{payment.pk:08d}'
            payment.save(update_fields=['transaction_id', 'updated_at'])
        if payment.paid_at is None:
            payment.mark_completed()
        finalize_invoice_payment(payment.invoice)


class PaymentVerifySerializer(serializers.Serializer):
    transaction_id = serializers.CharField(required=False, allow_blank=True)

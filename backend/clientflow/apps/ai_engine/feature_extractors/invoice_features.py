from decimal import Decimal

from django.db.models import Count, Sum
from django.utils import timezone

from clientflow.apps.invoices.models import Invoice
from clientflow.apps.payments.models import Payment


def extract_invoice_features(invoice):
    today = timezone.localdate()
    invoice_age_days = max((today - invoice.issue_date).days, 0)
    days_until_due = (invoice.due_date - today).days
    client_invoices = Invoice.objects.filter(client=invoice.client).exclude(pk=invoice.pk)
    completed_payments = Payment.objects.filter(
        invoice__client=invoice.client,
        status=Payment.Status.COMPLETED,
    )
    payment_history = completed_payments.aggregate(
        payment_count=Count('id'),
        total_paid=Sum('amount'),
    )
    overdue_invoice_count = client_invoices.filter(status=Invoice.Status.OVERDUE).count()
    paid_invoice_count = client_invoices.filter(status=Invoice.Status.PAID).count()
    invoice_count = client_invoices.count()

    late_count = 0
    for payment in completed_payments.select_related('invoice'):
        if payment.paid_at and payment.paid_at.date() > payment.invoice.due_date:
            late_count += 1

    return {
        'invoice_id': invoice.pk,
        'invoice_age_days': invoice_age_days,
        'days_until_due': days_until_due,
        'invoice_total': str(invoice.total),
        'outstanding_balance': str(invoice.balance_due),
        'is_overdue': invoice.status == Invoice.Status.OVERDUE or days_until_due < 0,
        'client_invoice_count': invoice_count,
        'client_paid_invoice_count': paid_invoice_count,
        'client_overdue_invoice_count': overdue_invoice_count,
        'client_payment_count': payment_history['payment_count'] or 0,
        'client_total_paid': str(payment_history['total_paid'] or Decimal('0.00')),
        'previous_late_payments': late_count,
        'late_payment_rate': round(late_count / max(payment_history['payment_count'] or 0, 1), 4),
    }

from decimal import Decimal

from django.utils import timezone

from clientflow.apps.notifications.utils import create_billing_notification

from .models import Invoice


def mark_overdue_invoices(*, queryset=None):
    today = timezone.localdate()
    qs = queryset or Invoice.objects.all()
    # A draft has not been issued to a client, so it cannot be overdue yet.
    overdue_invoices = qs.filter(
        due_date__lt=today,
        status=Invoice.Status.SENT,
    )
    invoices = list(overdue_invoices.select_related('owner'))
    overdue_invoices.update(status=Invoice.Status.OVERDUE)
    for invoice in invoices:
        create_billing_notification(
            user=invoice.owner,
            title='Invoice overdue',
            message=f'Invoice {invoice.invoice_number} is overdue.',
        )


def finalize_invoice_payment(invoice):
    if invoice.balance_due <= Decimal('0.00'):
        if invoice.status != Invoice.Status.PAID:
            invoice.mark_paid()

from decimal import Decimal

from django.db.models import Sum
from django.utils import timezone

from clientflow.apps.invoices.models import Invoice
from clientflow.apps.payments.models import Payment


def month_bounds(anchor):
    start = anchor.replace(day=1)
    if start.month == 12:
        next_month = start.replace(year=start.year + 1, month=1)
    else:
        next_month = start.replace(month=start.month + 1)
    return start, next_month


def previous_month(anchor):
    start = anchor.replace(day=1)
    if start.month == 1:
        return start.replace(year=start.year - 1, month=12)
    return start.replace(month=start.month - 1)


def paid_revenue_between(queryset, start, end):
    return queryset.filter(
        status=Payment.Status.COMPLETED,
        paid_at__date__gte=start,
        paid_at__date__lt=end,
    ).aggregate(total=Sum('amount')).get('total') or Decimal('0.00')


def extract_revenue_features(user):
    scope = getattr(user, 'organization_name', '') or getattr(user, 'email', '')
    today = timezone.localdate()
    current_start, current_end = month_bounds(today)
    previous_start, previous_end = month_bounds(previous_month(today))
    payments = Payment.objects.filter(invoice__organization_name=scope)
    invoices = Invoice.objects.filter(organization_name=scope)

    current_month_paid = paid_revenue_between(payments, current_start, current_end)
    previous_month_paid = paid_revenue_between(payments, previous_start, previous_end)
    outstanding_invoice_value = invoices.exclude(status__in=[Invoice.Status.PAID, Invoice.Status.CANCELLED]).aggregate(total=Sum('total')).get('total') or Decimal('0.00')
    overdue_invoice_value = invoices.filter(status=Invoice.Status.OVERDUE).aggregate(total=Sum('total')).get('total') or Decimal('0.00')
    paid_invoices = invoices.filter(status=Invoice.Status.PAID).count()
    invoice_count = invoices.count()

    six_months_ago = current_start - timezone.timedelta(days=180)
    six_month_revenue = payments.filter(
        status=Payment.Status.COMPLETED,
        paid_at__date__gte=six_months_ago,
        paid_at__date__lt=current_end,
    ).aggregate(total=Sum('amount')).get('total') or Decimal('0.00')
    average_monthly_revenue = six_month_revenue / Decimal('6.00')

    return {
        'current_month_paid_revenue': str(current_month_paid),
        'previous_month_paid_revenue': str(previous_month_paid),
        'outstanding_invoice_value': str(outstanding_invoice_value),
        'overdue_invoice_value': str(overdue_invoice_value),
        'average_monthly_revenue': str(average_monthly_revenue.quantize(Decimal('0.01'))),
        'payment_completion_rate': round(paid_invoices / max(invoice_count, 1), 4),
        'invoice_count': invoice_count,
        'paid_invoice_count': paid_invoices,
    }

from decimal import Decimal

from django.contrib.contenttypes.models import ContentType
from django.db.models import Sum
from django.utils import timezone

from clientflow.apps.crm.models import Activity, Note
from clientflow.apps.invoices.models import Invoice
from clientflow.apps.payments.models import Payment
from clientflow.apps.projects.models import Project


def extract_client_features(client):
    content_type = ContentType.objects.get_for_model(client)
    activities = Activity.objects.filter(target_content_type=content_type, target_object_id=client.pk)
    notes = Note.objects.filter(target_content_type=content_type, target_object_id=client.pk)
    last_activity_at = None
    latest_activity = activities.order_by('-created_at').first()
    latest_note = notes.order_by('-created_at').first()
    candidates = [item.created_at for item in [latest_activity, latest_note] if item]
    if candidates:
        last_activity_at = max(candidates)

    now = timezone.now()
    days_since_last_activity = (now - last_activity_at).days if last_activity_at else None
    invoices = Invoice.objects.filter(client=client)
    payments = Payment.objects.filter(invoice__client=client, status=Payment.Status.COMPLETED)
    total_revenue = payments.aggregate(total=Sum('amount')).get('total') or Decimal('0.00')
    invoice_count = invoices.count()
    paid_invoice_count = invoices.filter(status=Invoice.Status.PAID).count()
    late_payment_count = 0
    for payment in payments.select_related('invoice'):
        if payment.paid_at and payment.paid_at.date() > payment.invoice.due_date:
            late_payment_count += 1

    age_days = max((now - client.created_at).days, 1)
    communication_events = activities.count() + notes.count()

    return {
        'client_id': client.pk,
        'days_since_last_activity': days_since_last_activity,
        'unpaid_invoice_count': invoices.exclude(status__in=[Invoice.Status.PAID, Invoice.Status.CANCELLED]).count(),
        'overdue_invoice_count': invoices.filter(status=Invoice.Status.OVERDUE).count(),
        'total_revenue': str(total_revenue),
        'completed_project_count': Project.objects.filter(client=client, status=Project.Status.COMPLETED).count(),
        'active_project_count': Project.objects.filter(client=client, status=Project.Status.ACTIVE).count(),
        'invoice_count': invoice_count,
        'paid_invoice_count': paid_invoice_count,
        'payment_count': payments.count(),
        'late_payment_count': late_payment_count,
        'payment_completion_rate': round(paid_invoice_count / max(invoice_count, 1), 4),
        'late_payment_rate': round(late_payment_count / max(payments.count(), 1), 4),
        'activity_count': activities.count(),
        'note_count': notes.count(),
        'communication_frequency': round(communication_events / age_days, 4),
    }

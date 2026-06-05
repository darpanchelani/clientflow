from decimal import Decimal

from django.db.models import Avg
from django.utils import timezone

from clientflow.apps.ai_engine.models import AIPrediction
from clientflow.apps.invoices.models import Invoice
from clientflow.apps.payments.models import Payment

from .insight_rule_engine import insight_payload


def latest_payment_risk(invoice, user):
    prediction = AIPrediction.objects.filter(
        user=user,
        entity_type=AIPrediction.EntityType.INVOICE,
        entity_id=invoice.pk,
        prediction_type=AIPrediction.PredictionType.PAYMENT_RISK,
    ).first()
    return prediction.score if prediction else None


def generate_invoice_insights(user, scope):
    insights = []
    today = timezone.localdate()
    invoices = Invoice.objects.filter(organization_name=scope).select_related('client')[:300]
    average_total = invoices.aggregate(avg=Avg('total')).get('avg') or Decimal('0.00')

    for invoice in invoices:
        balance_due = invoice.balance_due
        if invoice.status in [Invoice.Status.PAID, Invoice.Status.CANCELLED]:
            continue

        days_until_due = (invoice.due_date - today).days
        risk_score = latest_payment_risk(invoice, user)

        if 0 <= days_until_due <= 3 and risk_score is not None and risk_score >= 70:
            insights.append(insight_payload(
                title='Invoice likely to become overdue',
                description=f'{invoice.invoice_number} is due in {days_until_due} days and has payment risk score {risk_score}.',
                category='invoice',
                severity='warning',
                recommendation='Send a payment reminder and confirm expected payment timing.',
                source_type='invoice',
                source_id=invoice.pk,
                score=risk_score,
                metadata={'invoice_number': invoice.invoice_number, 'days_until_due': days_until_due},
            ))

        if invoice.status == Invoice.Status.OVERDUE or invoice.due_date < today:
            insights.append(insight_payload(
                title='Overdue invoice critical alert',
                description=f'{invoice.invoice_number} is overdue with {balance_due} still outstanding.',
                category='invoice',
                severity='critical',
                recommendation='Escalate collection follow-up and confirm payment plan with the client.',
                source_type='invoice',
                source_id=invoice.pk,
                score=min(balance_due, Decimal('999999.00')),
                metadata={'invoice_number': invoice.invoice_number, 'balance_due': str(balance_due)},
            ))

        if average_total and invoice.total > average_total * Decimal('1.5') and balance_due > 0:
            insights.append(insight_payload(
                title='Large unpaid invoice warning',
                description=f'{invoice.invoice_number} is above average invoice value and remains unpaid.',
                category='invoice',
                severity='warning',
                recommendation='Prioritize this invoice in billing follow-up because it has outsized cash impact.',
                source_type='invoice',
                source_id=invoice.pk,
                score=invoice.total,
                metadata={'invoice_number': invoice.invoice_number, 'total': str(invoice.total), 'average_total': str(average_total)},
            ))

    recent_payments = Payment.objects.filter(
        invoice__organization_name=scope,
        status=Payment.Status.COMPLETED,
        paid_at__gte=timezone.now() - timezone.timedelta(days=2),
    ).select_related('invoice')[:50]
    for payment in recent_payments:
        insights.append(insight_payload(
            title='Payment received',
            description=f'Payment of {payment.amount} was received for {payment.invoice.invoice_number}.',
            category='invoice',
            severity='success',
            recommendation='Reconcile the invoice and send a receipt or thank-you note if appropriate.',
            source_type='payment',
            source_id=payment.pk,
            score=payment.amount,
            metadata={'invoice_id': payment.invoice_id, 'transaction_id': payment.transaction_id},
        ))

    return insights

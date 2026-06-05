from decimal import Decimal

from django.contrib.contenttypes.models import ContentType
from django.db.models import Sum
from django.utils import timezone

from clientflow.apps.clients.models import Client
from clientflow.apps.crm.models import Activity
from clientflow.apps.invoices.models import Invoice
from clientflow.apps.payments.models import Payment
from clientflow.apps.projects.models import Project

from .churn_prediction_service import score_client_churn_risk
from .insight_rule_engine import insight_payload


def days_since_client_activity(client):
    content_type = ContentType.objects.get_for_model(client)
    activity = Activity.objects.filter(
        target_content_type=content_type,
        target_object_id=client.pk,
    ).order_by('-created_at').first()
    if not activity:
        return None
    return (timezone.now() - activity.created_at).days


def generate_client_insights(user, scope):
    insights = []
    clients = Client.objects.filter(organization_name=scope)[:150]

    for client in clients:
        unpaid_count = Invoice.objects.filter(client=client).exclude(
            status__in=[Invoice.Status.PAID, Invoice.Status.CANCELLED],
        ).count()
        overdue_count = Invoice.objects.filter(client=client, status=Invoice.Status.OVERDUE).count()
        active_projects = Project.objects.filter(client=client, status=Project.Status.ACTIVE).count()
        completed_payments = Payment.objects.filter(invoice__client=client, status=Payment.Status.COMPLETED)
        total_revenue = completed_payments.aggregate(total=Sum('amount')).get('total') or Decimal('0.00')
        days_since_activity = days_since_client_activity(client)

        churn = score_client_churn_risk(client=client, user=user)
        if churn['churn_score'] >= 70 or (overdue_count > 0 and (days_since_activity is None or days_since_activity > 30)):
            insights.append(insight_payload(
                title='Client churn risk',
                description=f'{client.name} has churn score {churn["churn_score"]}, overdue invoices={overdue_count}, and recent activity gap={days_since_activity}.',
                category='client',
                severity='critical' if churn['churn_score'] >= 80 else 'warning',
                recommendation=churn['retention_recommendation'],
                source_type='client',
                source_id=client.pk,
                score=churn['churn_score'],
                metadata={'health_score': churn['health_score'], 'overdue_invoice_count': overdue_count},
            ))

        if total_revenue >= Decimal('5000.00') and active_projects > 0 and unpaid_count == 0:
            insights.append(insight_payload(
                title='Top client opportunity',
                description=f'{client.name} has generated {total_revenue} in revenue, has active work, and no unpaid invoices.',
                category='client',
                severity='success',
                recommendation='Consider an expansion, retainer, or testimonial conversation with this client.',
                source_type='client',
                source_id=client.pk,
                score=total_revenue,
                metadata={'active_projects': active_projects, 'total_revenue': str(total_revenue)},
            ))

        if active_projects > 0 and (days_since_activity is None or days_since_activity > 14):
            insights.append(insight_payload(
                title='Client follow-up recommended',
                description=f'{client.name} has active work but no recorded activity for {days_since_activity or "unknown"} days.',
                category='client',
                severity='info',
                recommendation='Schedule a check-in to confirm satisfaction, blockers, and next milestones.',
                source_type='client',
                source_id=client.pk,
                score=days_since_activity or 100,
                metadata={'active_projects': active_projects},
            ))

    return insights

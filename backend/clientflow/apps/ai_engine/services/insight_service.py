import logging

from django.db import IntegrityError, transaction
from django.utils import timezone

from clientflow.apps.crm.utils import get_scope_key

from ..models import AIInsight
from .client_insight_service import generate_client_insights
from .insight_rule_engine import SEVERITY_ORDER, sort_insights
from .invoice_insight_service import generate_invoice_insights
from .lead_insight_service import generate_lead_insights
from .project_insight_service import generate_project_insights
from .revenue_insight_service import generate_revenue_insights
from .task_insight_service import generate_task_insights


logger = logging.getLogger(__name__)


def dedupe_key(payload):
    return '|'.join(
        [
            payload.get('source_type') or '',
            str(payload.get('source_id') or ''),
            payload.get('category') or '',
            payload.get('title') or '',
        ]
    )


def create_notification_for_insight(insight):
    if insight.severity not in [AIInsight.Severity.CRITICAL, AIInsight.Severity.WARNING]:
        return None
    try:
        from clientflow.apps.notifications.models import Notification
        from clientflow.apps.notifications.utils import create_notification
    except Exception:
        return None

    category_map = {
        AIInsight.Category.INVOICE: Notification.Category.BILLING,
        AIInsight.Category.REVENUE: Notification.Category.BILLING,
        AIInsight.Category.LEAD: Notification.Category.CRM,
        AIInsight.Category.CLIENT: Notification.Category.CRM,
        AIInsight.Category.PROJECT: Notification.Category.PROJECT,
        AIInsight.Category.TASK: Notification.Category.TASK,
        AIInsight.Category.WORKFLOW: Notification.Category.WORKFLOW,
        AIInsight.Category.SYSTEM: Notification.Category.SYSTEM,
    }
    return create_notification(
        user=insight.user,
        title=insight.title,
        message=insight.recommendation or insight.description,
        category=category_map.get(insight.category, Notification.Category.SYSTEM),
        metadata={
            'ai_insight_id': insight.pk,
            'severity': insight.severity,
            'source_type': insight.source_type,
            'source_id': insight.source_id,
        },
        dedupe_key=f'ai-insight:{insight.pk}:{dedupe_key({"source_type": insight.source_type, "source_id": insight.source_id, "category": insight.category, "title": insight.title})}',
    )


def save_insight(user, payload):
    lookup = {
        'user': user,
        'source_type': payload.get('source_type') or '',
        'source_id': payload.get('source_id'),
        'category': payload['category'],
        'title': payload['title'],
    }
    defaults = {
        'description': payload['description'],
        'severity': payload['severity'],
        'recommendation': payload.get('recommendation', ''),
        'score': payload.get('score'),
        'metadata': payload.get('metadata') or {},
    }
    try:
        with transaction.atomic():
            insight, created = AIInsight.objects.update_or_create(defaults=defaults, **lookup)
    except IntegrityError:
        insight = AIInsight.objects.filter(**lookup).first()
        created = False
    if insight and created:
        create_notification_for_insight(insight)
    return insight, created


def generate_insights_for_user(user):
    scope = get_scope_key(user)
    generators = [
        generate_lead_insights,
        generate_invoice_insights,
        generate_client_insights,
        generate_project_insights,
        generate_task_insights,
        generate_revenue_insights,
    ]
    payloads = []
    for generator in generators:
        try:
            payloads.extend(generator(user, scope))
        except Exception as exc:
            logger.exception('Insight generator failed: %s', generator.__name__)
            payloads.append({
                'title': 'Insight generation warning',
                'description': f'{generator.__name__} could not complete safely.',
                'category': AIInsight.Category.SYSTEM,
                'severity': AIInsight.Severity.WARNING,
                'recommendation': 'Review server logs and retry insight generation.',
                'source_type': 'system',
                'source_id': None,
                'score': None,
                'metadata': {'error': exc.__class__.__name__},
            })

    saved = []
    created_count = 0
    for payload in sort_insights(payloads):
        insight, created = save_insight(user, payload)
        if insight:
            saved.append(insight)
            created_count += int(created)

    return {
        'created_count': created_count,
        'count': len(saved),
        'results': sorted(
            saved,
            key=lambda item: (SEVERITY_ORDER.get(item.severity, 99), item.created_at),
        ),
    }


def list_insights_for_user(user, filters=None):
    filters = filters or {}
    queryset = AIInsight.objects.filter(user=user)
    for field in ['category', 'severity', 'is_read']:
        value = filters.get(field)
        if value not in [None, '']:
            queryset = queryset.filter(**{field: value})
    date_from = filters.get('date_from')
    if date_from:
        queryset = queryset.filter(created_at__date__gte=date_from)
    date_to = filters.get('date_to')
    if date_to:
        queryset = queryset.filter(created_at__date__lte=date_to)
    return queryset


def mark_insight_read(user, insight_id):
    insight = AIInsight.objects.get(user=user, pk=insight_id)
    insight.is_read = True
    insight.save(update_fields=['is_read', 'updated_at'])
    return insight


def mark_all_read(user):
    return AIInsight.objects.filter(user=user, is_read=False).update(is_read=True, updated_at=timezone.now())


def delete_old_insights(user, days=90):
    cutoff = timezone.now() - timezone.timedelta(days=days)
    deleted, _ = AIInsight.objects.filter(user=user, created_at__lt=cutoff).delete()
    return deleted

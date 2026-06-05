from django.contrib.contenttypes.models import ContentType
from django.utils import timezone

from clientflow.apps.automation.models import LeadFollowUp
from clientflow.apps.crm.models import Activity
from clientflow.apps.leads.models import Lead

from .insight_rule_engine import insight_payload


def recent_activity_exists(lead, days=7):
    content_type = ContentType.objects.get_for_model(lead)
    since = timezone.now() - timezone.timedelta(days=days)
    return Activity.objects.filter(
        target_content_type=content_type,
        target_object_id=lead.pk,
        created_at__gte=since,
    ).exists()


def generate_lead_insights(user, scope):
    insights = []
    now = timezone.now()
    leads = Lead.objects.filter(organization_name=scope).select_related('owner')[:200]

    for lead in leads:
        has_recent_activity = recent_activity_exists(lead)
        pending_followup = LeadFollowUp.objects.filter(
            lead=lead,
            status=LeadFollowUp.Status.PENDING,
        ).exists()
        age_days = (now - lead.created_at).days

        if lead.score >= 75 and not has_recent_activity and not pending_followup:
            insights.append(insight_payload(
                title='High-value lead requires attention',
                description=f'{lead.name} has a lead score of {lead.score} but no recent activity or pending follow-up.',
                category='lead',
                severity='warning',
                recommendation='Create a follow-up and contact this lead before engagement cools down.',
                source_type='lead',
                source_id=lead.pk,
                score=lead.score,
                metadata={'status': lead.status, 'source': lead.source},
            ))

        if age_days > 7 and lead.status not in [Lead.Status.WON, Lead.Status.LOST] and not has_recent_activity:
            insights.append(insight_payload(
                title='Stale lead warning',
                description=f'{lead.name} has been open for {age_days} days without recent activity.',
                category='lead',
                severity='warning',
                recommendation='Review the lead status and schedule the next touchpoint.',
                source_type='lead',
                source_id=lead.pk,
                score=min(age_days, 100),
                metadata={'age_days': age_days, 'status': lead.status},
            ))

        if lead.score >= 70 and lead.status in [Lead.Status.QUALIFIED, Lead.Status.PROPOSAL] and not hasattr(lead, 'client'):
            insights.append(insight_payload(
                title='Lead conversion opportunity',
                description=f'{lead.name} is in {lead.status} status with a strong score and has not been converted to a client.',
                category='lead',
                severity='info',
                recommendation='Confirm fit, send a proposal, or convert this lead if the opportunity is ready.',
                source_type='lead',
                source_id=lead.pk,
                score=lead.score,
                metadata={'status': lead.status},
            ))

    sources = Lead.objects.filter(organization_name=scope).values_list('source', flat=True).distinct()
    for source in sources:
        source_leads = Lead.objects.filter(organization_name=scope, source=source)
        total = source_leads.count()
        if total < 5:
            continue
        converted = source_leads.filter(status=Lead.Status.WON).count()
        rate = converted / total
        if rate < 0.15:
            insights.append(insight_payload(
                title='Poor performing lead source',
                description=f'{source} leads are converting at {rate:.0%} across {total} leads.',
                category='lead',
                severity='warning',
                recommendation='Review campaign quality or reallocate effort toward better converting channels.',
                source_type='lead_source',
                source_id=None,
                score=round(rate * 100, 2),
                metadata={'source': source, 'total': total, 'converted': converted},
            ))

    return insights

from django.contrib.contenttypes.models import ContentType
from django.utils import timezone

from clientflow.apps.automation.models import LeadFollowUp
from clientflow.apps.crm.models import Activity, Note


def extract_lead_features(lead):
    content_type = ContentType.objects.get_for_model(lead)
    activities = Activity.objects.filter(target_content_type=content_type, target_object_id=lead.pk)
    notes = Note.objects.filter(target_content_type=content_type, target_object_id=lead.pk)
    follow_ups = LeadFollowUp.objects.filter(lead=lead)
    now = timezone.now()
    lead_age_days = max((now - lead.created_at).days, 0)
    recent_window_days = min(max(lead_age_days, 1), 30)
    recent_since = now - timezone.timedelta(days=recent_window_days)
    recent_activity_count = activities.filter(created_at__gte=recent_since).count()
    recent_note_count = notes.filter(created_at__gte=recent_since).count()

    return {
        'lead_id': lead.pk,
        'source': lead.source,
        'status': lead.status,
        'activity_count': activities.count(),
        'note_count': notes.count(),
        'follow_up_count': follow_ups.count(),
        'completed_follow_up_count': follow_ups.filter(status=LeadFollowUp.Status.COMPLETED).count(),
        'pending_follow_up_count': follow_ups.filter(status=LeadFollowUp.Status.PENDING).count(),
        'lead_age_days': lead_age_days,
        'has_email': bool(lead.email),
        'has_phone': bool(lead.phone),
        'has_company': bool(lead.company),
        'recent_activity_count': recent_activity_count,
        'recent_note_count': recent_note_count,
        'activity_frequency': round((recent_activity_count + recent_note_count) / recent_window_days, 4),
    }

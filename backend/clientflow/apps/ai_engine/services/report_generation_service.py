from clientflow.apps.analytics.utils import build_analytics_payload

from ..models import AIReport
from .openai_service import generate_openai_report


def generate_ai_report(user, validated_data):
    report_type = validated_data['report_type']
    analytics_params = {
        key: value.isoformat() if hasattr(value, 'isoformat') else str(value)
        for key, value in validated_data.items()
        if key != 'report_type' and value not in (None, '')
    }
    snapshot = build_analytics_payload(user, analytics_params)
    content, model_name = generate_openai_report(report_type, snapshot)

    return AIReport.objects.create(
        user=user,
        report_type=report_type,
        title=content['title'][:255],
        executive_summary=content['executive_summary'],
        health_score=content['health_score'],
        confidence=content['confidence'],
        key_metrics=content['key_metrics'],
        findings=content['findings'],
        next_actions=content['next_actions'],
        methodology=content['methodology'],
        snapshot=snapshot,
        filters=analytics_params,
        period_start=snapshot['range']['start_date'],
        period_end=snapshot['range']['end_date'],
        provider='openai',
        model_name=model_name,
    )

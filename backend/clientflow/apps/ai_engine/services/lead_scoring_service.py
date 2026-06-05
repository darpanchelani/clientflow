from decimal import Decimal

from clientflow.apps.leads.models import Lead

from ..feature_extractors.lead_features import extract_lead_features
from ..models import AIPrediction


SOURCE_WEIGHTS = {
    Lead.Source.REFERRAL: 14,
    Lead.Source.WEBSITE: 10,
    Lead.Source.EMAIL: 8,
    Lead.Source.SOCIAL: 6,
    Lead.Source.ADS: 5,
    Lead.Source.MANUAL: 4,
    Lead.Source.OTHER: 2,
}

STATUS_WEIGHTS = {
    Lead.Status.NEW: 6,
    Lead.Status.CONTACTED: 14,
    Lead.Status.QUALIFIED: 28,
    Lead.Status.PROPOSAL: 34,
    Lead.Status.WON: 42,
    Lead.Status.LOST: -20,
}


def clamp(value, minimum=0, maximum=100):
    return max(minimum, min(maximum, value))


def lead_priority(score):
    if score >= 70:
        return 'high'
    if score >= 40:
        return 'medium'
    return 'low'


def lead_recommendation(priority, features):
    if features['status'] == Lead.Status.LOST:
        return 'Archive or re-engage only if new buying signals appear.'
    if priority == 'high':
        return 'Prioritize direct outreach and move this lead toward proposal.'
    if priority == 'medium':
        return 'Schedule a follow-up and collect missing qualification details.'
    return 'Nurture this lead and improve contact completeness before prioritizing sales effort.'


def score_lead(*, lead, user):
    features = extract_lead_features(lead)
    score = 20
    score += SOURCE_WEIGHTS.get(features['source'], 0)
    score += STATUS_WEIGHTS.get(features['status'], 0)
    score += 8 if features['has_email'] else -8
    score += 7 if features['has_phone'] else -5
    score += 6 if features['has_company'] else -3
    score += min(features['activity_count'] * 3, 15)
    score += min(features['note_count'] * 2, 10)
    score += min(features['follow_up_count'] * 2, 8)
    score += min(features['activity_frequency'] * 12, 10)
    if features['lead_age_days'] > 60:
        score -= 12
    elif features['lead_age_days'] > 30:
        score -= 6
    if features['pending_follow_up_count'] > 0:
        score += 4
    if features['completed_follow_up_count'] > 0:
        score += 5

    final_score = clamp(round(score, 2))
    probability = round(final_score / 100, 4)
    priority = lead_priority(final_score)
    recommendation = lead_recommendation(priority, features)
    explanation = (
        f"Score based on source={features['source']}, status={features['status']}, "
        f"{features['activity_count']} activities, {features['follow_up_count']} follow-ups, "
        f"age={features['lead_age_days']} days, and contact completeness."
    )
    result = {
        'score': final_score,
        'conversion_probability': probability,
        'priority': priority,
        'recommendation': recommendation,
        'features': features,
    }
    prediction = AIPrediction.objects.create(
        user=user,
        entity_type=AIPrediction.EntityType.LEAD,
        entity_id=lead.pk,
        prediction_type=AIPrediction.PredictionType.LEAD_SCORE,
        score=Decimal(str(final_score)),
        probability=Decimal(str(probability)),
        confidence=Decimal('0.7400'),
        result=result,
        explanation=explanation,
    )
    return {
        'prediction_id': prediction.pk,
        'score': final_score,
        'conversion_probability': probability,
        'priority': priority,
        'recommendation': recommendation,
        'explanation': explanation,
        'features': features,
    }

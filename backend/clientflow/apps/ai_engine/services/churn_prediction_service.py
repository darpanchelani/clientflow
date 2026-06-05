from decimal import Decimal

from ..feature_extractors.client_features import extract_client_features
from ..models import AIPrediction


def clamp(value, minimum=0, maximum=100):
    return max(minimum, min(maximum, value))


def risk_level(score):
    if score >= 70:
        return 'high'
    if score >= 40:
        return 'medium'
    return 'low'


def retention_recommendation(level, features):
    if level == 'high':
        return 'Schedule an account review, resolve overdue billing, and align on active project outcomes.'
    if level == 'medium':
        return 'Increase client touchpoints and review unpaid invoices before risk escalates.'
    return 'Maintain regular communication cadence and continue monitoring billing/project signals.'


def score_client_churn_risk(*, client, user):
    features = extract_client_features(client)
    score = 15
    if features['days_since_last_activity'] is None:
        score += 18
    elif features['days_since_last_activity'] > 60:
        score += 25
    elif features['days_since_last_activity'] > 30:
        score += 14
    score += min(features['unpaid_invoice_count'] * 8, 24)
    score += min(features['overdue_invoice_count'] * 14, 34)
    score += min(features['late_payment_count'] * 9, 27)
    if features['active_project_count'] == 0:
        score += 10
    if features['completed_project_count'] > 0:
        score -= min(features['completed_project_count'] * 4, 12)
    if Decimal(features['total_revenue']) > Decimal('10000.00'):
        score -= 8
    if features['communication_frequency'] >= 0.08:
        score -= 8
    if features['payment_completion_rate'] < 0.5 and features['invoice_count'] > 0:
        score += 10

    churn_score = clamp(round(score, 2))
    health_score = clamp(round(100 - churn_score, 2))
    level = risk_level(churn_score)
    recommendation = retention_recommendation(level, features)
    explanation = (
        f"Churn risk uses activity recency={features['days_since_last_activity']}, "
        f"unpaid invoices={features['unpaid_invoice_count']}, overdue invoices={features['overdue_invoice_count']}, "
        f"active projects={features['active_project_count']}, and payment behavior."
    )
    result = {
        'churn_score': churn_score,
        'risk_level': level,
        'health_score': health_score,
        'retention_recommendation': recommendation,
        'features': features,
    }
    prediction = AIPrediction.objects.create(
        user=user,
        entity_type=AIPrediction.EntityType.CLIENT,
        entity_id=client.pk,
        prediction_type=AIPrediction.PredictionType.CHURN_RISK,
        score=Decimal(str(churn_score)),
        probability=Decimal(str(round(churn_score / 100, 4))),
        confidence=Decimal('0.7200') if features['invoice_count'] or features['activity_count'] else Decimal('0.4300'),
        result=result,
        explanation=explanation,
    )
    return {
        'prediction_id': prediction.pk,
        'churn_score': churn_score,
        'risk_level': level,
        'health_score': health_score,
        'retention_recommendation': recommendation,
        'explanation': explanation,
        'features': features,
    }

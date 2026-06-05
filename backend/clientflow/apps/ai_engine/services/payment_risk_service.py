from decimal import Decimal

from clientflow.apps.invoices.models import Invoice

from ..feature_extractors.invoice_features import extract_invoice_features
from ..models import AIPrediction


def clamp(value, minimum=0, maximum=100):
    return max(minimum, min(maximum, value))


def risk_level(score):
    if score >= 70:
        return 'high'
    if score >= 40:
        return 'medium'
    return 'low'


def risk_recommendation(level, features):
    if level == 'high':
        return 'Escalate collection follow-up and confirm payment date with the client.'
    if level == 'medium':
        return 'Send a payment reminder and monitor this invoice closely.'
    return 'Continue normal billing cadence.'


def score_invoice_payment_risk(*, invoice, user):
    features = extract_invoice_features(invoice)
    score = 15
    total = Decimal(features['invoice_total'])
    outstanding = Decimal(features['outstanding_balance'])
    if features['is_overdue']:
        score += 35
    if features['days_until_due'] <= 3:
        score += 12
    if features['days_until_due'] < 0:
        score += min(abs(features['days_until_due']) * 2, 20)
    if total >= Decimal('10000'):
        score += 12
    elif total >= Decimal('5000'):
        score += 8
    if outstanding > Decimal('0.00'):
        score += min(float(outstanding / max(total, Decimal('1.00'))) * 18, 18)
    score += min(features['previous_late_payments'] * 10, 25)
    score += min(features['client_overdue_invoice_count'] * 8, 24)
    if features['client_paid_invoice_count'] >= 3 and features['previous_late_payments'] == 0:
        score -= 18
    if invoice.status == Invoice.Status.PAID:
        score = 0

    final_score = clamp(round(score, 2))
    probability = round(final_score / 100, 4)
    level = risk_level(final_score)
    recommendation = risk_recommendation(level, features)
    explanation = (
        f"Risk based on due window={features['days_until_due']} days, outstanding balance={features['outstanding_balance']}, "
        f"overdue={features['is_overdue']}, and {features['previous_late_payments']} previous late payments."
    )
    result = {
        'risk_score': final_score,
        'risk_level': level,
        'delay_probability': probability,
        'recommendation': recommendation,
        'features': features,
    }
    prediction = AIPrediction.objects.create(
        user=user,
        entity_type=AIPrediction.EntityType.INVOICE,
        entity_id=invoice.pk,
        prediction_type=AIPrediction.PredictionType.PAYMENT_RISK,
        score=Decimal(str(final_score)),
        probability=Decimal(str(probability)),
        confidence=Decimal('0.7100'),
        result=result,
        explanation=explanation,
    )
    return {
        'prediction_id': prediction.pk,
        'risk_score': final_score,
        'risk_level': level,
        'delay_probability': probability,
        'recommendation': recommendation,
        'explanation': explanation,
        'features': features,
    }

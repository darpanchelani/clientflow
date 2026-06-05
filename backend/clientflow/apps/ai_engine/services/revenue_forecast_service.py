from decimal import Decimal

from ..feature_extractors.revenue_features import extract_revenue_features


def decimal_string(value):
    return str(Decimal(value).quantize(Decimal('0.01')))


def forecast_revenue(*, user):
    features = extract_revenue_features(user)
    current = Decimal(features['current_month_paid_revenue'])
    previous = Decimal(features['previous_month_paid_revenue'])
    average = Decimal(features['average_monthly_revenue'])
    outstanding = Decimal(features['outstanding_invoice_value'])
    overdue = Decimal(features['overdue_invoice_value'])
    completion_rate = Decimal(str(features['payment_completion_rate']))

    if current > previous:
        trend_direction = 'up'
    elif current < previous:
        trend_direction = 'down'
    else:
        trend_direction = 'flat'

    baseline = max(current, average)
    outstanding_expected = outstanding * max(completion_rate, Decimal('0.15'))
    overdue_risk_adjustment = overdue * Decimal('0.45')
    projected_monthly = max(baseline + outstanding_expected - overdue_risk_adjustment, Decimal('0.00'))
    quarterly_forecast = projected_monthly * Decimal('3.00')
    confidence = 'low' if features['invoice_count'] == 0 else 'medium' if features['invoice_count'] < 5 else 'high'

    return {
        'current_month_revenue': decimal_string(current),
        'previous_month_revenue': decimal_string(previous),
        'projected_monthly_revenue': decimal_string(projected_monthly),
        'quarterly_forecast': decimal_string(quarterly_forecast),
        'outstanding_expected_revenue': decimal_string(outstanding_expected),
        'overdue_risk_adjustment': decimal_string(overdue_risk_adjustment),
        'trend_direction': trend_direction,
        'confidence': confidence,
        'features': features,
    }

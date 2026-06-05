from decimal import Decimal

from .insight_rule_engine import insight_payload
from .revenue_forecast_service import forecast_revenue


def generate_revenue_insights(user, scope):
    del scope
    forecast = forecast_revenue(user=user)
    current = Decimal(forecast['current_month_revenue'])
    previous = Decimal(forecast['previous_month_revenue'])
    outstanding = Decimal(forecast['features']['outstanding_invoice_value'])
    overdue = Decimal(forecast['features']['overdue_invoice_value'])
    insights = []

    if previous > 0:
        change = (current - previous) / previous
        if change <= Decimal('-0.15'):
            insights.append(insight_payload(
                title='Revenue decline warning',
                description=f'Current month revenue is {abs(change):.0%} below previous month.',
                category='revenue',
                severity='warning',
                recommendation='Review delayed invoices, stalled projects, and lead conversion activity.',
                source_type='revenue',
                source_id=None,
                score=abs(change) * 100,
                metadata=forecast,
            ))
        elif change >= Decimal('0.15'):
            insights.append(insight_payload(
                title='Revenue growth success',
                description=f'Current month revenue is {change:.0%} above previous month.',
                category='revenue',
                severity='success',
                recommendation='Identify what drove the growth and repeat it in active pipeline work.',
                source_type='revenue',
                source_id=None,
                score=change * 100,
                metadata=forecast,
            ))

    if outstanding >= Decimal('5000.00'):
        insights.append(insight_payload(
            title='Outstanding revenue warning',
            description=f'Outstanding invoice value is {outstanding}.',
            category='revenue',
            severity='warning',
            recommendation='Prioritize collection and payment confirmation for open invoices.',
            source_type='revenue',
            source_id=None,
            score=min(outstanding, Decimal('999999.00')),
            metadata=forecast,
        ))

    if overdue >= Decimal('1000.00'):
        insights.append(insight_payload(
            title='Overdue revenue critical',
            description=f'Overdue unpaid invoices total {overdue}.',
            category='revenue',
            severity='critical',
            recommendation='Escalate overdue invoice follow-up and review client payment risk.',
            source_type='revenue',
            source_id=None,
            score=min(overdue, Decimal('999999.00')),
            metadata=forecast,
        ))

    return insights

from dataclasses import dataclass
from decimal import Decimal


SEVERITY_ORDER = {
    'critical': 0,
    'warning': 1,
    'info': 2,
    'success': 3,
}


@dataclass(frozen=True)
class InsightRule:
    name: str
    evaluator: object

    def evaluate(self, context):
        result = self.evaluator(context)
        if result is None:
            return []
        if isinstance(result, list):
            return [item for item in result if item]
        return [result]


def insight_payload(*, title, description, category, severity, recommendation, source_type='', source_id=None, score=None, metadata=None):
    return {
        'title': title,
        'description': description,
        'category': category,
        'severity': severity,
        'recommendation': recommendation,
        'source_type': source_type,
        'source_id': source_id,
        'score': Decimal(str(score)) if score is not None else None,
        'metadata': metadata or {},
    }


def sort_insights(insights):
    return sorted(
        insights,
        key=lambda item: (
            SEVERITY_ORDER.get(item.get('severity'), 99),
            item.get('category', ''),
            item.get('title', ''),
        ),
    )

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AIInsightViewSet,
    AIPredictionViewSet,
    BulkLeadScoreView,
    ClientChurnRiskView,
    ClientHealthListView,
    InvoicePaymentRiskView,
    LeadScoreView,
    PaymentRiskListView,
    ProposalDraftViewSet,
    RevenueForecastView,
)

app_name = 'ai_engine'

router = DefaultRouter()
router.register(r'predictions', AIPredictionViewSet, basename='prediction')
router.register(r'insights', AIInsightViewSet, basename='insight')
router.register(r'proposals', ProposalDraftViewSet, basename='proposal')

urlpatterns = [
    path('leads/<int:pk>/score/', LeadScoreView.as_view(), name='lead-score'),
    path('leads/bulk-score/', BulkLeadScoreView.as_view(), name='bulk-lead-score'),
    path('invoices/<int:pk>/payment-risk/', InvoicePaymentRiskView.as_view(), name='invoice-payment-risk'),
    path('payment-risks/', PaymentRiskListView.as_view(), name='payment-risks'),
    path('clients/<int:pk>/churn-risk/', ClientChurnRiskView.as_view(), name='client-churn-risk'),
    path('clients/health/', ClientHealthListView.as_view(), name='client-health'),
    path('revenue/forecast/', RevenueForecastView.as_view(), name='revenue-forecast'),
    path('', include(router.urls)),
]

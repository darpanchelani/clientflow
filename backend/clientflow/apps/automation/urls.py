from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AutomationDashboardSummaryView,
    AutomationPreferenceView,
    GlobalActivityViewSet,
    LeadFollowUpViewSet,
    WorkflowRuleViewSet,
)

app_name = 'automation'

router = DefaultRouter()
router.register(r'workflow-rules', WorkflowRuleViewSet, basename='workflow-rule')
router.register(r'follow-ups', LeadFollowUpViewSet, basename='follow-up')
router.register(r'activity-feed', GlobalActivityViewSet, basename='activity-feed')

urlpatterns = [
    path('', include(router.urls)),
    path('preferences/', AutomationPreferenceView.as_view(), name='preferences'),
    path('dashboard-summary/', AutomationDashboardSummaryView.as_view(), name='dashboard-summary'),
]

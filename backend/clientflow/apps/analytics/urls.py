from django.urls import path

from .views import (
    AnalyticsDashboardView,
    ClientAnalyticsView,
    ProjectAnalyticsView,
    ReportExportView,
    RevenueAnalyticsView,
    SalesFunnelAnalyticsView,
    TaskAnalyticsView,
)

app_name = 'analytics'

urlpatterns = [
    path('dashboard/', AnalyticsDashboardView.as_view(), name='dashboard'),
    path('revenue/', RevenueAnalyticsView.as_view(), name='revenue'),
    path('sales-funnel/', SalesFunnelAnalyticsView.as_view(), name='sales-funnel'),
    path('projects/', ProjectAnalyticsView.as_view(), name='projects'),
    path('tasks/', TaskAnalyticsView.as_view(), name='tasks'),
    path('clients/', ClientAnalyticsView.as_view(), name='clients'),
    path('reports/export/', ReportExportView.as_view(), name='report-export'),
]

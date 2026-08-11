"""
Main URL configuration for ClientFlow
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from django.views.decorators.csrf import csrf_exempt
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from graphene_django.views import GraphQLView

from clientflow.health import health_live, health_ready


urlpatterns = [
    path('admin/', admin.site.urls),
    path('health/live', health_live, name='health-live'),
    path('health/ready', health_ready, name='health-ready'),
    path('api/schema/', SpectacularAPIView.as_view(), name='api-schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='api-schema'), name='api-docs'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='api-schema'), name='api-redoc'),
    path('graphql/', csrf_exempt(GraphQLView.as_view(graphiql=settings.DEBUG)), name='graphql'),
    path('api/auth/', include('clientflow.apps.authentication.urls', namespace='auth')),
    path('api/leads/', include('clientflow.apps.leads.urls', namespace='leads')),
    path('api/clients/', include('clientflow.apps.clients.urls', namespace='clients')),
    path('api/users/', include('clientflow.apps.users.urls', namespace='users-api')),
    path('api/v1/users/', include('clientflow.apps.users.urls', namespace='users')),
    path('api/projects/', include('clientflow.apps.projects.urls', namespace='projects')),
    path('api/tasks/', include('clientflow.apps.tasks.urls', namespace='tasks')),
    path('api/v1/projects/', include('clientflow.apps.projects.urls', namespace='projects-v1')),
    path('api/v1/tasks/', include('clientflow.apps.tasks.urls', namespace='tasks-v1')),
    path('api/invoices/', include('clientflow.apps.invoices.urls', namespace='invoices')),
    path('api/payments/', include('clientflow.apps.payments.urls', namespace='payments')),
    path('api/notifications/', include('clientflow.apps.notifications.urls', namespace='notifications')),
    path('api/automation/', include('clientflow.apps.automation.urls', namespace='automation')),
    path('api/analytics/', include('clientflow.apps.analytics.urls', namespace='analytics-api')),
    path('api/ai/', include('clientflow.apps.ai_engine.urls', namespace='ai')),
    path('api/v1/invoices/', include('clientflow.apps.invoices.urls', namespace='invoices-v1')),
    path('api/v1/payments/', include('clientflow.apps.payments.urls', namespace='payments-v1')),
    path('api/v1/analytics/', include('clientflow.apps.analytics.urls', namespace='analytics')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

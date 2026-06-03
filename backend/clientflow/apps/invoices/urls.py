from rest_framework.routers import DefaultRouter

from .views import InvoiceViewSet

app_name = 'invoices'

router = DefaultRouter()
router.register(r'', InvoiceViewSet, basename='invoice')

urlpatterns = router.urls


from django.conf import settings
from django.db import models


class Notification(models.Model):
    class Category(models.TextChoices):
        BILLING = 'billing', 'Billing'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='notifications',
        on_delete=models.CASCADE,
    )
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.BILLING)
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


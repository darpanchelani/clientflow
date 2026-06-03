from django.conf import settings
from django.db import models
from django.utils import timezone


class Payment(models.Model):
    class Method(models.TextChoices):
        CARD = 'card', 'Card'
        BANK_TRANSFER = 'bank_transfer', 'Bank transfer'
        CASH = 'cash', 'Cash'
        STRIPE_MOCK = 'stripe_mock', 'Stripe mock'

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        COMPLETED = 'completed', 'Completed'
        FAILED = 'failed', 'Failed'

    invoice = models.ForeignKey(
        'invoices.Invoice',
        related_name='payments',
        on_delete=models.CASCADE,
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=30, choices=Method.choices)
    transaction_id = models.CharField(max_length=120, unique=True, null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    paid_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='payments',
        on_delete=models.CASCADE,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['invoice', 'status']),
            models.Index(fields=['transaction_id']),
        ]

    def __str__(self):
        return f'{self.invoice_id}:{self.amount}'

    def save(self, *args, **kwargs):
        if not self.transaction_id:
            import uuid
            self.transaction_id = f'MOCK-{uuid.uuid4().hex[:12].upper()}'
        super().save(*args, **kwargs)

    def mark_completed(self):
        self.status = self.Status.COMPLETED
        self.paid_at = self.paid_at or timezone.now()
        self.save(update_fields=['status', 'paid_at', 'updated_at'])
        
        # Trigger notification centrally
        from clientflow.apps.notifications.utils import create_billing_notification
        create_billing_notification(
            user=self.invoice.owner,
            title='Payment received',
            message=f'Payment for invoice {self.invoice.invoice_number} has been received.',
        )


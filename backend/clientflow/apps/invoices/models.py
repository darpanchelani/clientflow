from decimal import Decimal

from django.conf import settings
from django.db import models, transaction
from django.core.exceptions import ValidationError
from django.utils import timezone


class Invoice(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        SENT = 'sent', 'Sent'
        PAID = 'paid', 'Paid'
        OVERDUE = 'overdue', 'Overdue'
        CANCELLED = 'cancelled', 'Cancelled'

    invoice_number = models.CharField(max_length=30, unique=True, null=True, blank=True, editable=False)
    client = models.ForeignKey(
        'clients.Client',
        related_name='invoices',
        on_delete=models.CASCADE,
    )
    project = models.ForeignKey(
        'projects.Project',
        related_name='invoices',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='invoices',
        on_delete=models.CASCADE,
    )
    organization_name = models.CharField(max_length=255, db_index=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    issue_date = models.DateField(default=timezone.localdate)
    due_date = models.DateField()
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    tax = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    notes = models.TextField(blank=True, default='')
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization_name', 'status']),
            models.Index(fields=['client', 'status']),
            models.Index(fields=['due_date', 'status']),
        ]

    def __str__(self):
        return self.invoice_number or f'Invoice #{self.pk or "new"}'

    @property
    def balance_due(self):
        paid = self.payments.filter(status='completed').aggregate(total=models.Sum('amount')).get('total') or Decimal('0.00')
        balance = self.total - paid
        return balance if balance > Decimal('0.00') else Decimal('0.00')

    def recompute_totals(self, *, save=True):
        subtotal = Decimal('0.00')
        # Query the database directly to bypass any prefetch/relation cache
        for item in self.items.model.objects.filter(invoice=self):
            subtotal += item.total_price
        self.subtotal = subtotal
        tax = Decimal(str(self.tax))
        self.total = (subtotal + tax).quantize(Decimal('0.01'))
        self.subtotal = self.subtotal.quantize(Decimal('0.01'))
        self.tax = tax.quantize(Decimal('0.01'))
        if save:
            self.save(update_fields=['subtotal', 'tax', 'total', 'updated_at'])

    def mark_paid(self):
        self.status = self.Status.PAID
        self.paid_at = timezone.now()
        self.save(update_fields=['status', 'paid_at', 'updated_at'])

    def save(self, *args, **kwargs):
        creating = self.pk is None
        if self.invoice_number:
            super().save(*args, **kwargs)
            return

        with transaction.atomic():
            super().save(*args, **kwargs)
            if not self.invoice_number:
                self.invoice_number = f'INV-{self.pk:06d}'
                super().save(update_fields=['invoice_number', 'updated_at'])


class InvoiceItem(models.Model):
    invoice = models.ForeignKey(Invoice, related_name='items', on_delete=models.CASCADE)
    description = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    total_price = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['id']

    def clean(self):
        quantity = Decimal(str(self.quantity))
        unit_price = Decimal(str(self.unit_price))
        if quantity < 0 or unit_price < 0:
            raise ValidationError('Quantity and unit price must be non-negative.')

    def save(self, *args, **kwargs):
        quantity = Decimal(str(self.quantity))
        unit_price = Decimal(str(self.unit_price))
        self.total_price = (quantity * unit_price).quantize(Decimal('0.01'))
        super().save(*args, **kwargs)
        self.invoice.recompute_totals(save=True)

    def delete(self, *args, **kwargs):
        invoice = self.invoice
        super().delete(*args, **kwargs)
        invoice.recompute_totals(save=True)

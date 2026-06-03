from django.conf import settings
from django.contrib.contenttypes.fields import GenericRelation
from django.db import models


class Client(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        INACTIVE = 'inactive', 'Inactive'
        ARCHIVED = 'archived', 'Archived'

    lead = models.OneToOneField(
        'leads.Lead',
        related_name='client',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, default='')
    phone = models.CharField(max_length=50, blank=True, default='')
    company = models.CharField(max_length=255, blank=True, default='')
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.ACTIVE)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='clients',
        on_delete=models.CASCADE,
    )
    organization_name = models.CharField(max_length=255, db_index=True)
    tags = models.ManyToManyField('crm.Tag', related_name='clients', blank=True)
    activities = GenericRelation('crm.Activity', related_query_name='client')
    notes = GenericRelation('crm.Note', related_query_name='client')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization_name', 'status']),
            models.Index(fields=['owner', 'created_at']),
        ]

    def __str__(self):
        return self.name


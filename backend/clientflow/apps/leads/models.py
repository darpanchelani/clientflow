from django.conf import settings
from django.contrib.contenttypes.fields import GenericRelation
from django.db import models


class Lead(models.Model):
    class Source(models.TextChoices):
        WEBSITE = 'website', 'Website'
        REFERRAL = 'referral', 'Referral'
        EMAIL = 'email', 'Email'
        SOCIAL = 'social', 'Social'
        ADS = 'ads', 'Ads'
        MANUAL = 'manual', 'Manual'
        OTHER = 'other', 'Other'

    class Status(models.TextChoices):
        NEW = 'new', 'New'
        CONTACTED = 'contacted', 'Contacted'
        QUALIFIED = 'qualified', 'Qualified'
        PROPOSAL = 'proposal', 'Proposal'
        WON = 'won', 'Won'
        LOST = 'lost', 'Lost'

    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, default='')
    phone = models.CharField(max_length=50, blank=True, default='')
    company = models.CharField(max_length=255, blank=True, default='')
    source = models.CharField(max_length=30, choices=Source.choices, default=Source.WEBSITE)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.NEW)
    score = models.PositiveSmallIntegerField(default=0)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='leads',
        on_delete=models.CASCADE,
    )
    organization_name = models.CharField(max_length=255, db_index=True)
    tags = models.ManyToManyField('crm.Tag', related_name='leads', blank=True)
    activities = GenericRelation(
        'crm.Activity',
        content_type_field='target_content_type',
        object_id_field='target_object_id',
        related_query_name='lead',
    )
    notes = GenericRelation(
        'crm.Note',
        content_type_field='target_content_type',
        object_id_field='target_object_id',
        related_query_name='lead',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization_name', 'status'], name='leads_lea_organi_8f9ad4_idx'),
            models.Index(fields=['organization_name', 'source'], name='leads_lea_organi_5e4db2_idx'),
            models.Index(fields=['owner', 'created_at'], name='leads_lea_owner__2e4b1a_idx'),
        ]

    def __str__(self):
        return self.name

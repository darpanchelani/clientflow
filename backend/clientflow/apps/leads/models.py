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
    activities = GenericRelation('crm.Activity', related_query_name='lead')
    notes = GenericRelation('crm.Note', related_query_name='lead')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization_name', 'status']),
            models.Index(fields=['organization_name', 'source']),
            models.Index(fields=['owner', 'created_at']),
        ]

    def __str__(self):
        return self.name


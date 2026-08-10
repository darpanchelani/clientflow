from django.conf import settings
from django.db import models


class AIPrediction(models.Model):
    class EntityType(models.TextChoices):
        LEAD = 'lead', 'Lead'
        CLIENT = 'client', 'Client'
        PROJECT = 'project', 'Project'
        TASK = 'task', 'Task'
        INVOICE = 'invoice', 'Invoice'

    class PredictionType(models.TextChoices):
        LEAD_SCORE = 'lead_score', 'Lead score'
        CHURN_RISK = 'churn_risk', 'Churn risk'
        PAYMENT_RISK = 'payment_risk', 'Payment risk'
        PROJECT_RISK = 'project_risk', 'Project risk'
        TASK_DELAY = 'task_delay', 'Task delay'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='ai_predictions',
        on_delete=models.CASCADE,
    )
    entity_type = models.CharField(max_length=30, choices=EntityType.choices)
    entity_id = models.PositiveIntegerField()
    prediction_type = models.CharField(max_length=50, choices=PredictionType.choices)
    score = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    probability = models.DecimalField(max_digits=5, decimal_places=4, null=True, blank=True)
    confidence = models.DecimalField(max_digits=5, decimal_places=4, null=True, blank=True)
    result = models.JSONField(blank=True, default=dict)
    explanation = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'entity_type', 'entity_id']),
            models.Index(fields=['user', 'prediction_type', 'created_at']),
        ]

    def __str__(self):
        return f'{self.prediction_type}:{self.entity_type}:{self.entity_id}'


class AIInsight(models.Model):
    class Category(models.TextChoices):
        LEAD = 'lead', 'Lead'
        CLIENT = 'client', 'Client'
        INVOICE = 'invoice', 'Invoice'
        PROJECT = 'project', 'Project'
        TASK = 'task', 'Task'
        REVENUE = 'revenue', 'Revenue'
        WORKFLOW = 'workflow', 'Workflow'
        SYSTEM = 'system', 'System'
        SALES = 'sales', 'Sales'
        BILLING = 'billing', 'Billing'
        PRODUCTIVITY = 'productivity', 'Productivity'

    class Severity(models.TextChoices):
        INFO = 'info', 'Info'
        SUCCESS = 'success', 'Success'
        WARNING = 'warning', 'Warning'
        CRITICAL = 'critical', 'Critical'
        LOW = 'low', 'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH = 'high', 'High'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='ai_insights',
        on_delete=models.CASCADE,
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=30, choices=Category.choices)
    severity = models.CharField(max_length=20, choices=Severity.choices, default=Severity.INFO)
    recommendation = models.TextField(blank=True, default='')
    source_type = models.CharField(max_length=50, blank=True, default='')
    source_id = models.PositiveIntegerField(null=True, blank=True)
    score = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    metadata = models.JSONField(blank=True, default=dict)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read', 'created_at']),
            models.Index(fields=['user', 'category', 'severity']),
            models.Index(fields=['user', 'source_type', 'source_id', 'category']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'source_type', 'source_id', 'category', 'title'],
                name='unique_ai_insight_source_title',
            ),
        ]

    def __str__(self):
        return self.title


class ProposalDraft(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        APPROVED = 'approved', 'Approved'
        SENT = 'sent', 'Sent'
        ARCHIVED = 'archived', 'Archived'

    class ProposalType(models.TextChoices):
        SERVICE = 'service', 'Service'
        PROJECT = 'project', 'Project'
        RETAINER = 'retainer', 'Retainer'
        CUSTOM = 'custom', 'Custom'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='proposal_drafts',
        on_delete=models.CASCADE,
    )
    client = models.ForeignKey(
        'clients.Client',
        related_name='proposal_drafts',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    lead = models.ForeignKey(
        'leads.Lead',
        related_name='proposal_drafts',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    project = models.ForeignKey(
        'projects.Project',
        related_name='proposal_drafts',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    title = models.CharField(max_length=255)
    generated_content = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    proposal_type = models.CharField(max_length=20, choices=ProposalType.choices, default=ProposalType.CUSTOM)
    estimated_budget = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    estimated_timeline = models.CharField(max_length=255, blank=True, default='')
    services_offered = models.TextField(blank=True, default='')
    client_problem = models.TextField(blank=True, default='')
    proposed_solution = models.TextField(blank=True, default='')
    sent_at = models.DateTimeField(null=True, blank=True)
    sent_to_email = models.EmailField(blank=True, default='')
    last_downloaded_at = models.DateTimeField(null=True, blank=True)
    download_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status', 'created_at']),
            models.Index(fields=['client', 'created_at']),
            models.Index(fields=['lead', 'created_at']),
            models.Index(fields=['project', 'created_at']),
        ]

    def __str__(self):
        return self.title


class AIReport(models.Model):
    class ReportType(models.TextChoices):
        OVERVIEW = 'overview', 'Executive overview'
        REVENUE = 'revenue', 'Revenue and cash flow'
        SALES = 'sales', 'Sales pipeline'
        CLIENTS = 'clients', 'Client health'
        DELIVERY = 'delivery', 'Project delivery'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='ai_reports',
        on_delete=models.CASCADE,
    )
    report_type = models.CharField(max_length=30, choices=ReportType.choices)
    title = models.CharField(max_length=255)
    executive_summary = models.TextField()
    health_score = models.PositiveSmallIntegerField()
    confidence = models.CharField(max_length=20)
    key_metrics = models.JSONField(default=list)
    findings = models.JSONField(default=list)
    next_actions = models.JSONField(default=list)
    methodology = models.TextField(blank=True, default='')
    snapshot = models.JSONField(default=dict)
    filters = models.JSONField(default=dict)
    period_start = models.DateField()
    period_end = models.DateField()
    provider = models.CharField(max_length=30, default='openai')
    model_name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'report_type', 'created_at']),
            models.Index(fields=['user', 'created_at']),
        ]

    def __str__(self):
        return self.title

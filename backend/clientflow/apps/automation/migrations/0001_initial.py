from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('contenttypes', '0002_remove_content_type_name'),
        ('leads', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='AutomationPreference',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('in_app_notifications_enabled', models.BooleanField(default=True)),
                ('email_notifications_enabled', models.BooleanField(default=False)),
                ('lead_follow_up_days', models.PositiveSmallIntegerField(default=7)),
                ('task_due_soon_hours', models.PositiveSmallIntegerField(default=24)),
                ('invoice_before_due_days', models.PositiveSmallIntegerField(default=3)),
                ('invoice_after_overdue_days', models.PositiveSmallIntegerField(default=1)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='automation_preferences', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='WorkflowRule',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('trigger_type', models.CharField(choices=[('lead_status_changed', 'Lead status changed'), ('lead_inactive', 'Lead inactive'), ('invoice_overdue', 'Invoice overdue'), ('invoice_due_soon', 'Invoice due soon'), ('payment_received', 'Payment received'), ('task_due_soon', 'Task due soon'), ('task_overdue', 'Task overdue'), ('project_completed', 'Project completed'), ('project_overdue', 'Project overdue')], max_length=50)),
                ('action_type', models.CharField(choices=[('create_notification', 'Create notification'), ('create_follow_up', 'Create follow-up'), ('email_ready', 'Email ready')], max_length=50)),
                ('is_active', models.BooleanField(default=True)),
                ('conditions', models.JSONField(blank=True, default=dict)),
                ('action_config', models.JSONField(blank=True, default=dict)),
                ('organization_name', models.CharField(db_index=True, max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='workflow_rules', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['trigger_type', 'name'],
            },
        ),
        migrations.CreateModel(
            name='LeadFollowUp',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('due_date', models.DateField()),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('completed', 'Completed'), ('cancelled', 'Cancelled')], default='pending', max_length=20)),
                ('notes', models.TextField(blank=True, default='')),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('assigned_user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='lead_follow_ups', to=settings.AUTH_USER_MODEL)),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_follow_ups', to=settings.AUTH_USER_MODEL)),
                ('lead', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='follow_ups', to='leads.lead')),
            ],
            options={
                'ordering': ['status', 'due_date'],
            },
        ),
        migrations.CreateModel(
            name='GlobalActivity',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('target_object_id', models.PositiveIntegerField(blank=True, null=True)),
                ('organization_name', models.CharField(db_index=True, max_length=255)),
                ('verb', models.CharField(max_length=80)),
                ('message', models.TextField()),
                ('source', models.CharField(db_index=True, max_length=50)),
                ('metadata', models.JSONField(blank=True, default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('actor', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='global_activities', to=settings.AUTH_USER_MODEL)),
                ('target_content_type', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='contenttypes.contenttype')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='workflowrule',
            index=models.Index(fields=['organization_name', 'trigger_type', 'is_active'], name='automation__organiz_f0df17_idx'),
        ),
        migrations.AddIndex(
            model_name='leadfollowup',
            index=models.Index(fields=['assigned_user', 'status', 'due_date'], name='automation__assigne_10f2c9_idx'),
        ),
        migrations.AddIndex(
            model_name='leadfollowup',
            index=models.Index(fields=['lead', 'status'], name='automation__lead_id_10a8c4_idx'),
        ),
        migrations.AddIndex(
            model_name='globalactivity',
            index=models.Index(fields=['organization_name', 'created_at'], name='automation__organiz_127c03_idx'),
        ),
        migrations.AddIndex(
            model_name='globalactivity',
            index=models.Index(fields=['source', 'created_at'], name='automation__source_9e557f_idx'),
        ),
        migrations.AddIndex(
            model_name='globalactivity',
            index=models.Index(fields=['target_content_type', 'target_object_id'], name='automation__target__9efb8e_idx'),
        ),
    ]

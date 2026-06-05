from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('contenttypes', '0002_remove_content_type_name'),
        ('notifications', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='notification',
            name='category',
            field=models.CharField(
                choices=[
                    ('billing', 'Billing'),
                    ('crm', 'CRM'),
                    ('project', 'Project'),
                    ('task', 'Task'),
                    ('workflow', 'Workflow'),
                    ('system', 'System'),
                ],
                default='billing',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='notification',
            name='metadata',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name='notification',
            name='target_content_type',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='contenttypes.contenttype'),
        ),
        migrations.AddField(
            model_name='notification',
            name='target_object_id',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['user', 'is_read', 'created_at'], name='notificatio_user_id_91e664_idx'),
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['category', 'created_at'], name='notificatio_categor_6c55c6_idx'),
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['target_content_type', 'target_object_id'], name='notificatio_target__36fe73_idx'),
        ),
    ]

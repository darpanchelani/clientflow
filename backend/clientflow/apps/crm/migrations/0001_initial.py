from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ('contenttypes', '0002_remove_content_type_name'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Tag',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('color', models.CharField(blank=True, default='#1976d2', max_length=20)),
                ('organization_name', models.CharField(db_index=True, max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='crm_tags', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['name'],
            },
        ),
        migrations.AddConstraint(
            model_name='tag',
            constraint=models.UniqueConstraint(fields=('organization_name', 'name'), name='unique_tag_per_organization'),
        ),
        migrations.CreateModel(
            name='Activity',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('target_object_id', models.PositiveIntegerField()),
                ('action', models.CharField(choices=[('created', 'Created'), ('updated', 'Updated'), ('status_changed', 'Status changed'), ('note_added', 'Note added'), ('tagged', 'Tagged'), ('converted', 'Converted'), ('deleted', 'Deleted')], max_length=50)),
                ('message', models.TextField(blank=True, default='')),
                ('metadata', models.JSONField(blank=True, default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('actor', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='crm_activities', to=settings.AUTH_USER_MODEL)),
                ('target_content_type', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='contenttypes.contenttype')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='Note',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('target_object_id', models.PositiveIntegerField()),
                ('body', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('author', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='crm_notes', to=settings.AUTH_USER_MODEL)),
                ('target_content_type', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='contenttypes.contenttype')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='activity',
            index=models.Index(fields=['target_content_type', 'target_object_id'], name='crm_activi_target_8cf6c7_idx'),
        ),
        migrations.AddIndex(
            model_name='activity',
            index=models.Index(fields=['action'], name='crm_activi_action_8f8fca_idx'),
        ),
        migrations.AddIndex(
            model_name='note',
            index=models.Index(fields=['target_content_type', 'target_object_id'], name='crm_note_target_590b0f_idx'),
        ),
    ]

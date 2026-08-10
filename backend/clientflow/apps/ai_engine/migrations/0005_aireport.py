from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ('ai_engine', '0004_proposaldraft_download_count_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='AIReport',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('report_type', models.CharField(choices=[('overview', 'Executive overview'), ('revenue', 'Revenue and cash flow'), ('sales', 'Sales pipeline'), ('clients', 'Client health'), ('delivery', 'Project delivery')], max_length=30)),
                ('title', models.CharField(max_length=255)),
                ('executive_summary', models.TextField()),
                ('health_score', models.PositiveSmallIntegerField()),
                ('confidence', models.CharField(max_length=20)),
                ('key_metrics', models.JSONField(default=list)),
                ('findings', models.JSONField(default=list)),
                ('next_actions', models.JSONField(default=list)),
                ('methodology', models.TextField(blank=True, default='')),
                ('snapshot', models.JSONField(default=dict)),
                ('filters', models.JSONField(default=dict)),
                ('period_start', models.DateField()),
                ('period_end', models.DateField()),
                ('provider', models.CharField(default='openai', max_length=30)),
                ('model_name', models.CharField(max_length=100)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='ai_reports', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.AddIndex(
            model_name='aireport',
            index=models.Index(fields=['user', 'report_type', 'created_at'], name='ai_engine_a_user_id_677064_idx'),
        ),
        migrations.AddIndex(
            model_name='aireport',
            index=models.Index(fields=['user', 'created_at'], name='ai_engine_a_user_id_4d18fa_idx'),
        ),
    ]

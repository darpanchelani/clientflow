from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ('crm', '0001_initial'),
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Lead',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('email', models.EmailField(blank=True, default='', max_length=254)),
                ('phone', models.CharField(blank=True, default='', max_length=50)),
                ('company', models.CharField(blank=True, default='', max_length=255)),
                ('source', models.CharField(choices=[('website', 'Website'), ('referral', 'Referral'), ('email', 'Email'), ('social', 'Social'), ('ads', 'Ads'), ('manual', 'Manual'), ('other', 'Other')], default='website', max_length=30)),
                ('status', models.CharField(choices=[('new', 'New'), ('contacted', 'Contacted'), ('qualified', 'Qualified'), ('proposal', 'Proposal'), ('won', 'Won'), ('lost', 'Lost')], default='new', max_length=30)),
                ('score', models.PositiveSmallIntegerField(default=0)),
                ('organization_name', models.CharField(db_index=True, max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('owner', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='leads', to=settings.AUTH_USER_MODEL)),
                ('tags', models.ManyToManyField(blank=True, related_name='leads', to='crm.tag')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='lead',
            index=models.Index(fields=['organization_name', 'status'], name='leads_lea_organi_8f9ad4_idx'),
        ),
        migrations.AddIndex(
            model_name='lead',
            index=models.Index(fields=['organization_name', 'source'], name='leads_lea_organi_5e4db2_idx'),
        ),
        migrations.AddIndex(
            model_name='lead',
            index=models.Index(fields=['owner', 'created_at'], name='leads_lea_owner__2e4b1a_idx'),
        ),
    ]

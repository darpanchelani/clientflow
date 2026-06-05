import logging

from celery import shared_task

from clientflow.apps.users.models import User

from .services.insight_service import generate_insights_for_user


logger = logging.getLogger(__name__)


@shared_task
def generate_daily_business_insights():
    generated = 0
    for user in User.objects.filter(is_active=True).iterator():
        try:
            result = generate_insights_for_user(user)
            generated += result['created_count']
        except Exception:
            logger.exception('Daily business insight generation failed for user_id=%s', user.pk)
    return {'created_count': generated}

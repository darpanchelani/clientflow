from .models import Notification


def create_billing_notification(*, user, title, message):
    if user is None:
        return None
    return Notification.objects.create(user=user, title=title, message=message)


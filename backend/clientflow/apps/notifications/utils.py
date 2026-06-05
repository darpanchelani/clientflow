from .models import Notification


def create_notification(
    *,
    user,
    title,
    message,
    category=Notification.Category.SYSTEM,
    target=None,
    metadata=None,
    dedupe_key=None,
):
    if user is None:
        return None
    payload = metadata or {}
    if dedupe_key:
        payload = {**payload, 'dedupe_key': dedupe_key}
        existing = Notification.objects.filter(user=user, metadata__dedupe_key=dedupe_key).first()
        if existing:
            return existing
    return Notification.objects.create(
        user=user,
        category=category,
        title=title,
        message=message,
        target=target,
        metadata=payload,
    )


def create_billing_notification(*, user, title, message, target=None, metadata=None, dedupe_key=None):
    return create_notification(
        user=user,
        title=title,
        message=message,
        category=Notification.Category.BILLING,
        target=target,
        metadata=metadata,
        dedupe_key=dedupe_key,
    )

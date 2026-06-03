from django.contrib.contenttypes.models import ContentType

from .models import Activity, Note
from .serializers import ActivitySerializer, NoteSerializer


def get_scope_key(user):
    return getattr(user, 'organization_name', '') or getattr(user, 'email', '')


def log_activity(*, target, action, actor=None, message='', metadata=None):
    metadata = metadata or {}
    return Activity.objects.create(
        target_content_type=ContentType.objects.get_for_model(target.__class__),
        target_object_id=target.pk,
        action=action,
        actor=actor,
        message=message,
        metadata=metadata,
    )


def add_note(*, target, body, author):
    note = Note.objects.create(
        target_content_type=ContentType.objects.get_for_model(target.__class__),
        target_object_id=target.pk,
        body=body,
        author=author,
    )
    log_activity(
        target=target,
        action=Activity.Action.NOTE_ADDED,
        actor=author,
        message='Note added',
        metadata={'note_id': note.pk},
    )
    return note


def serialize_timeline(target):
    activities = [
        {'item_type': 'activity', **ActivitySerializer(activity).data}
        for activity in target.activities.all()
    ]
    notes = [
        {'item_type': 'note', **NoteSerializer(note).data}
        for note in target.notes.all()
    ]
    items = activities + notes
    items.sort(key=lambda item: item['created_at'], reverse=True)
    return items


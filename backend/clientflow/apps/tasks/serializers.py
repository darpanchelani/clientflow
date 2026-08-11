from rest_framework import serializers

from clientflow.apps.projects.models import Project
from clientflow.apps.projects.serializers import ProjectSerializer
from clientflow.apps.users.models import User

from .models import Task, TaskActivity


class UserSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'role')
        read_only_fields = fields
        ref_name = 'TaskUserSummary'


class TaskActivitySerializer(serializers.ModelSerializer):
    actor_email = serializers.SerializerMethodField()

    class Meta:
        model = TaskActivity
        fields = ('id', 'action', 'message', 'metadata', 'actor_email', 'created_at')
        read_only_fields = fields

    def get_actor_email(self, obj) -> str | None:
        return getattr(obj.actor, 'email', None)


class TaskSerializer(serializers.ModelSerializer):
    project = ProjectSerializer(read_only=True)
    project_id = serializers.PrimaryKeyRelatedField(
        source='project',
        queryset=Project.objects.all(),
        write_only=True,
    )
    assigned_to = UserSummarySerializer(read_only=True)
    assigned_to_id = serializers.PrimaryKeyRelatedField(
        source='assigned_to',
        queryset=User.objects.all(),
        required=False,
        allow_null=True,
        write_only=True,
    )

    class Meta:
        model = Task
        fields = (
            'id',
            'title',
            'description',
            'project',
            'project_id',
            'assigned_to',
            'assigned_to_id',
            'status',
            'priority',
            'due_date',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'project', 'assigned_to', 'created_at', 'updated_at')

    def validate(self, attrs):
        project = attrs.get('project')
        assigned_to = attrs.get('assigned_to')
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        instance = getattr(self, 'instance', None)
        if project is None and instance is not None:
            project = instance.project
        if assigned_to is None and instance is not None and 'assigned_to' not in attrs:
            assigned_to = instance.assigned_to
        if project is not None and user is not None:
            if project.owner_id != user.id and project.client.organization_name != getattr(user, 'organization_name', ''):
                raise serializers.ValidationError('Project does not belong to your organization.')
        if assigned_to is not None and project is not None:
            if assigned_to.organization_name != project.client.organization_name:
                raise serializers.ValidationError('Assigned user must belong to the same organization as the project.')
        return attrs


class TaskStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Task.Status.choices)


class TaskAssignSerializer(serializers.Serializer):
    assigned_to_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), allow_null=True, required=False)

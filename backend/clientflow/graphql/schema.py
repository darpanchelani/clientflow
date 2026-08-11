import graphene
from graphene_django import DjangoObjectType
from graphql import GraphQLError

from clientflow.apps.clients.models import Client
from clientflow.apps.invoices.models import Invoice
from clientflow.apps.leads.models import Lead
from clientflow.apps.projects.models import Project
from clientflow.apps.tasks.models import Task


class LeadType(DjangoObjectType):
    class Meta:
        model = Lead
        fields = (
            "id",
            "name",
            "email",
            "phone",
            "company",
            "source",
            "status",
            "score",
            "created_at",
            "updated_at",
        )


class ClientType(DjangoObjectType):
    class Meta:
        model = Client
        fields = (
            "id",
            "name",
            "email",
            "phone",
            "company",
            "status",
            "created_at",
            "updated_at",
        )


class ProjectType(DjangoObjectType):
    class Meta:
        model = Project
        fields = (
            "id",
            "name",
            "description",
            "status",
            "start_date",
            "end_date",
            "created_at",
            "updated_at",
        )


class TaskType(DjangoObjectType):
    class Meta:
        model = Task
        fields = (
            "id",
            "title",
            "description",
            "status",
            "priority",
            "due_date",
            "created_at",
            "updated_at",
        )


class InvoiceType(DjangoObjectType):
    balance_due = graphene.Decimal(required=True)

    class Meta:
        model = Invoice
        fields = (
            "id",
            "invoice_number",
            "status",
            "issue_date",
            "due_date",
            "subtotal",
            "tax",
            "total",
            "created_at",
            "updated_at",
        )


def require_user(info):
    user = getattr(info.context, "user", None)
    if not user or not user.is_authenticated:
        raise GraphQLError(
            "Authentication credentials were not provided.",
            extensions={"code": "UNAUTHENTICATED"},
        )
    return user


class Query(graphene.ObjectType):
    me = graphene.Field("clientflow.graphql.schema.UserSummaryType")
    leads = graphene.List(LeadType, status=graphene.String(), search=graphene.String())
    clients = graphene.List(
        ClientType, status=graphene.String(), search=graphene.String()
    )
    projects = graphene.List(ProjectType, status=graphene.String())
    tasks = graphene.List(TaskType, project_id=graphene.ID(), status=graphene.String())
    invoices = graphene.List(InvoiceType, status=graphene.String())

    def resolve_me(root, info):
        return require_user(info)

    def resolve_leads(root, info, status=None, search=None):
        user = require_user(info)
        queryset = Lead.objects.filter(organization_name=user.organization_name)
        if status:
            queryset = queryset.filter(status=status)
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset[:100]

    def resolve_clients(root, info, status=None, search=None):
        user = require_user(info)
        queryset = Client.objects.filter(organization_name=user.organization_name)
        if status:
            queryset = queryset.filter(status=status)
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset[:100]

    def resolve_projects(root, info, status=None):
        user = require_user(info)
        queryset = Project.objects.filter(
            owner__organization_name=user.organization_name
        )
        if status:
            queryset = queryset.filter(status=status)
        return queryset[:100]

    def resolve_tasks(root, info, project_id=None, status=None):
        user = require_user(info)
        queryset = Task.objects.filter(
            project__owner__organization_name=user.organization_name
        )
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        if status:
            queryset = queryset.filter(status=status)
        return queryset[:100]

    def resolve_invoices(root, info, status=None):
        user = require_user(info)
        queryset = Invoice.objects.filter(organization_name=user.organization_name)
        if status:
            queryset = queryset.filter(status=status)
        return queryset[:100]


class UserSummaryType(graphene.ObjectType):
    id = graphene.ID(required=True)
    email = graphene.String(required=True)
    first_name = graphene.String(required=True)
    last_name = graphene.String(required=True)
    role = graphene.String(required=True)
    organization_name = graphene.String(required=True)


schema = graphene.Schema(query=Query)

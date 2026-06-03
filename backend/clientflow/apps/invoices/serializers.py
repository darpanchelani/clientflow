from decimal import Decimal

from django.db import transaction
from rest_framework import serializers

from clientflow.apps.clients.models import Client
from clientflow.apps.clients.serializers import ClientSerializer
from clientflow.apps.crm.models import Activity
from clientflow.apps.crm.utils import get_scope_key
from clientflow.apps.notifications.utils import create_billing_notification
from clientflow.apps.projects.models import Project
from clientflow.apps.projects.serializers import ProjectSerializer

from .models import Invoice, InvoiceItem


class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = ('id', 'description', 'quantity', 'unit_price', 'total_price')
        read_only_fields = ('id', 'total_price')

    def validate_quantity(self, value):
        if value < 0:
            raise serializers.ValidationError('Quantity cannot be negative.')
        return value

    def validate_unit_price(self, value):
        if value < 0:
            raise serializers.ValidationError('Unit price cannot be negative.')
        return value


class InvoiceSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = ('id', 'invoice_number', 'status', 'issue_date', 'due_date', 'total')
        read_only_fields = fields


class InvoiceSerializer(serializers.ModelSerializer):
    client = ClientSerializer(read_only=True)
    client_id = serializers.PrimaryKeyRelatedField(
        source='client',
        queryset=Client.objects.all(),
        write_only=True,
    )
    project = ProjectSerializer(read_only=True)
    project_id = serializers.PrimaryKeyRelatedField(
        source='project',
        queryset=Project.objects.all(),
        required=False,
        allow_null=True,
        write_only=True,
    )
    items = InvoiceItemSerializer(many=True)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    tax = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    total = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    balance_due = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = (
            'id',
            'invoice_number',
            'client',
            'client_id',
            'project',
            'project_id',
            'status',
            'issue_date',
            'due_date',
            'subtotal',
            'tax',
            'total',
            'balance_due',
            'is_overdue',
            'notes',
            'items',
            'paid_at',
            'created_at',
            'updated_at',
        )
        read_only_fields = (
            'id',
            'invoice_number',
            'client',
            'project',
            'status',
            'subtotal',
            'total',
            'balance_due',
            'is_overdue',
            'paid_at',
            'created_at',
            'updated_at',
        )

    def get_balance_due(self, obj):
        return obj.balance_due

    def get_is_overdue(self, obj):
        return obj.status == Invoice.Status.OVERDUE

    def validate(self, attrs):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        instance = getattr(self, 'instance', None)
        client = attrs.get('client') or getattr(instance, 'client', None)
        project = attrs.get('project') or getattr(instance, 'project', None)
        if client is not None and project is not None and project.client_id != client.id:
            raise serializers.ValidationError('Project must belong to the selected client.')

        if client is not None and user is not None:
            scope = get_scope_key(user)
            if client.organization_name != scope:
                raise serializers.ValidationError('Selected client does not belong to your organization.')

        if project is not None and user is not None:
            scope = get_scope_key(user)
            if project.client.organization_name != scope:
                raise serializers.ValidationError('Selected project does not belong to your organization.')

        tax = attrs.get('tax')
        if tax is not None and tax < 0:
            raise serializers.ValidationError({'tax': 'Tax cannot be negative.'})

        if attrs.get('due_date') and attrs.get('issue_date') and attrs['due_date'] < attrs['issue_date']:
            raise serializers.ValidationError({'due_date': 'Due date must be on or after the issue date.'})

        if instance and instance.status != Invoice.Status.DRAFT:
            if not user or not getattr(user, 'is_admin_role', False):
                raise serializers.ValidationError('Invoices cannot be edited after being sent unless you are an admin.')

        return attrs

    def _validate_items(self, items):
        if not items:
            raise serializers.ValidationError({'items': 'At least one invoice item is required.'})
        for item in items:
            if item['quantity'] < 0 or item['unit_price'] < 0:
                raise serializers.ValidationError({'items': 'Invoice item values cannot be negative.'})
        return items

    def create(self, validated_data):
        items = self._validate_items(validated_data.pop('items'))
        validated_data.setdefault('tax', Decimal('0.00'))
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if user and 'owner' not in validated_data:
            validated_data['owner'] = user
        if user and 'organization_name' not in validated_data:
            validated_data['organization_name'] = get_scope_key(user)

        with transaction.atomic():
            invoice = Invoice.objects.create(**validated_data)
            self._replace_items(invoice, items)
            invoice.refresh_from_db()
        create_billing_notification(
            user=invoice.owner,
            title='Invoice created',
            message=f'Invoice {invoice.invoice_number} has been created.',
        )
        return invoice

    def update(self, instance, validated_data):
        items = validated_data.pop('items', None)
        for field, value in validated_data.items():
            setattr(instance, field, value)

        with transaction.atomic():
            instance.save()
            if items is not None:
                self._replace_items(instance, self._validate_items(items))
                instance.refresh_from_db()
            else:
                instance.recompute_totals(save=True)
        return instance

    def _replace_items(self, invoice, items):
        invoice.items.all().delete()
        for item in items:
            InvoiceItem.objects.create(
                invoice=invoice,
                description=item['description'],
                quantity=item['quantity'],
                unit_price=item['unit_price'],
            )


class InvoiceStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Invoice.Status.choices)


class InvoiceSendSerializer(serializers.Serializer):
    confirm = serializers.BooleanField(required=False, default=True)


class PaymentSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    payment_method = serializers.CharField()
    transaction_id = serializers.CharField(allow_null=True, required=False)
    status = serializers.CharField()
    paid_at = serializers.DateTimeField(allow_null=True, required=False)


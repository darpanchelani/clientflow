import csv
import io
import zipfile
from datetime import timedelta
from decimal import Decimal
from xml.sax.saxutils import escape

from django.db.models import Avg, Count, DecimalField, DurationField, ExpressionWrapper, F, Q, Sum
from django.db.models.functions import Coalesce, TruncDate, TruncMonth
from django.http import HttpResponse
from django.utils import timezone

from clientflow.apps.clients.models import Client
from clientflow.apps.crm.utils import get_scope_key
from clientflow.apps.invoices.models import Invoice
from clientflow.apps.leads.models import Lead
from clientflow.apps.payments.models import Payment
from clientflow.apps.projects.models import Project
from clientflow.apps.tasks.models import Task


def parse_analytics_range(params):
    today = timezone.localdate()
    preset = params.get('range', 'last_30_days')
    if params.get('start_date') and params.get('end_date'):
        return timezone.datetime.fromisoformat(params['start_date']).date(), timezone.datetime.fromisoformat(params['end_date']).date()
    if preset == 'today':
        return today, today
    if preset == 'last_7_days':
        return today - timedelta(days=6), today
    if preset == 'last_quarter':
        return today - timedelta(days=89), today
    return today - timedelta(days=29), today


def org_filter(user):
    return get_scope_key(user)


def date_filter(field, start_date, end_date):
    return {f'{field}__date__gte': start_date, f'{field}__date__lte': end_date}


def decimal_value(value):
    return str((value or Decimal('0.00')).quantize(Decimal('0.01')))


def scoped_querysets(user, start_date, end_date, params=None):
    params = params or {}
    scope = org_filter(user)
    client_id = params.get('client')
    project_id = params.get('project')
    user_id = params.get('team_member')

    leads = Lead.objects.filter(organization_name=scope)
    clients = Client.objects.filter(organization_name=scope)
    projects = Project.objects.filter(client__organization_name=scope)
    tasks = Task.objects.filter(project__client__organization_name=scope)
    invoices = Invoice.objects.filter(organization_name=scope)
    payments = Payment.objects.filter(invoice__organization_name=scope)

    if client_id:
        clients = clients.filter(id=client_id)
        projects = projects.filter(client_id=client_id)
        tasks = tasks.filter(project__client_id=client_id)
        invoices = invoices.filter(client_id=client_id)
        payments = payments.filter(invoice__client_id=client_id)
    if project_id:
        projects = projects.filter(id=project_id)
        tasks = tasks.filter(project_id=project_id)
        invoices = invoices.filter(project_id=project_id)
        payments = payments.filter(invoice__project_id=project_id)
    if user_id:
        leads = leads.filter(owner_id=user_id)
        clients = clients.filter(owner_id=user_id)
        projects = projects.filter(owner_id=user_id)
        tasks = tasks.filter(assigned_to_id=user_id)
        invoices = invoices.filter(owner_id=user_id)
        payments = payments.filter(created_by_id=user_id)

    return {
        'leads': leads,
        'clients': clients,
        'projects': projects,
        'tasks': tasks,
        'invoices': invoices,
        'payments': payments,
        'range_leads': leads.filter(created_at__date__gte=start_date, created_at__date__lte=end_date),
        'range_clients': clients.filter(created_at__date__gte=start_date, created_at__date__lte=end_date),
        'range_projects': projects.filter(created_at__date__gte=start_date, created_at__date__lte=end_date),
        'range_tasks': tasks.filter(created_at__date__gte=start_date, created_at__date__lte=end_date),
        'range_invoices': invoices.filter(issue_date__gte=start_date, issue_date__lte=end_date),
        'range_payments': payments.filter(created_at__date__gte=start_date, created_at__date__lte=end_date),
    }


def build_analytics_payload(user, params):
    start_date, end_date = parse_analytics_range(params)
    qs = scoped_querysets(user, start_date, end_date, params)
    today = timezone.localdate()

    paid_payments = qs['payments'].filter(status=Payment.Status.COMPLETED)
    range_paid_payments = qs['range_payments'].filter(status=Payment.Status.COMPLETED)
    invoices = qs['invoices']
    tasks = qs['tasks']
    projects = qs['projects']
    leads = qs['leads']
    clients = qs['clients']

    total_revenue = range_paid_payments.aggregate(total=Coalesce(Sum('amount'), Decimal('0.00'), output_field=DecimalField()))['total']
    outstanding = invoices.exclude(status__in=[Invoice.Status.PAID, Invoice.Status.CANCELLED]).aggregate(total=Coalesce(Sum('total'), Decimal('0.00'), output_field=DecimalField()))['total']
    overdue = invoices.filter(status=Invoice.Status.OVERDUE).aggregate(total=Coalesce(Sum('total'), Decimal('0.00'), output_field=DecimalField()))['total']
    paid_invoice_count = invoices.filter(status=Invoice.Status.PAID).count()
    invoice_count = invoices.count()

    lead_total = leads.count()
    qualified = leads.filter(status=Lead.Status.QUALIFIED).count()
    converted = leads.filter(status=Lead.Status.WON).count() + clients.filter(lead__isnull=False).count()
    lost = leads.filter(status=Lead.Status.LOST).count()
    conversion_rate = round((converted / lead_total) * 100, 2) if lead_total else 0
    days = max((end_date - start_date).days + 1, 1)
    lead_velocity = round(qs['range_leads'].count() / days, 2)

    project_duration = ExpressionWrapper(F('updated_at') - F('created_at'), output_field=DurationField())
    avg_completion = projects.filter(status=Project.Status.COMPLETED).annotate(duration=project_duration).aggregate(avg=Avg('duration'))['avg']

    return {
        'range': {'start_date': start_date.isoformat(), 'end_date': end_date.isoformat()},
        'summary': {
            'total_revenue': decimal_value(total_revenue),
            'outstanding_revenue': decimal_value(outstanding),
            'overdue_revenue': decimal_value(overdue),
            'invoice_count': invoice_count,
            'paid_invoice_count': paid_invoice_count,
            'payment_count': range_paid_payments.count(),
            'lead_count': qs['range_leads'].count(),
            'client_count': clients.count(),
            'active_project_count': projects.filter(status=Project.Status.ACTIVE).count(),
            'open_task_count': tasks.exclude(status=Task.Status.DONE).count(),
        },
        'sales_funnel': {
            'new_leads': leads.filter(status=Lead.Status.NEW).count(),
            'qualified_leads': qualified,
            'converted_leads': converted,
            'lost_leads': lost,
            'conversion_rate': conversion_rate,
            'lead_velocity': lead_velocity,
            'pipeline_value': decimal_value(invoices.exclude(status__in=[Invoice.Status.PAID, Invoice.Status.CANCELLED]).aggregate(total=Coalesce(Sum('total'), Decimal('0.00'), output_field=DecimalField()))['total']),
            'revenue_forecast': decimal_value(outstanding * Decimal('0.35')),
        },
        'revenue': {
            'total_revenue': decimal_value(total_revenue),
            'monthly_revenue': [
                {'month': item['month'].date().isoformat(), 'total': decimal_value(item['total'])}
                for item in paid_payments.annotate(month=TruncMonth('paid_at')).values('month').annotate(total=Sum('amount')).order_by('month')
                if item['month']
            ],
            'outstanding_revenue': decimal_value(outstanding),
            'overdue_revenue': decimal_value(overdue),
            'by_client': [
                {'client': item['invoice__client__name'], 'total': decimal_value(item['total'])}
                for item in paid_payments.values('invoice__client__name').annotate(total=Sum('amount')).order_by('-total')[:10]
            ],
            'by_project': [
                {'project': item['invoice__project__name'] or 'Unassigned', 'total': decimal_value(item['total'])}
                for item in paid_payments.values('invoice__project__name').annotate(total=Sum('amount')).order_by('-total')[:10]
            ],
        },
        'projects': {
            'active': projects.filter(status=Project.Status.ACTIVE).count(),
            'completed': projects.filter(status=Project.Status.COMPLETED).count(),
            'delayed': projects.filter(end_date__lt=today).exclude(status=Project.Status.COMPLETED).count(),
            'average_completion_days': avg_completion.days if avg_completion else 0,
            'status_breakdown': list(projects.values('status').annotate(count=Count('id')).order_by('status')),
            'team_workload': list(tasks.values('assigned_to__email').annotate(open_tasks=Count('id', filter=~Q(status=Task.Status.DONE))).order_by('-open_tasks')[:10]),
        },
        'tasks': {
            'completed': tasks.filter(status=Task.Status.DONE).count(),
            'open': tasks.exclude(status=Task.Status.DONE).count(),
            'overdue': tasks.filter(due_date__lt=today).exclude(status=Task.Status.DONE).count(),
            'completion_rate': round((tasks.filter(status=Task.Status.DONE).count() / tasks.count()) * 100, 2) if tasks.count() else 0,
            'status_breakdown': list(tasks.values('status').annotate(count=Count('id')).order_by('status')),
            'completion_trends': [
                {'date': item['date'].isoformat(), 'count': item['count']}
                for item in tasks.filter(status=Task.Status.DONE).annotate(date=TruncDate('updated_at')).values('date').annotate(count=Count('id')).order_by('date')
            ],
        },
        'clients': {
            'active': clients.filter(status=Client.Status.ACTIVE).count(),
            'new': qs['range_clients'].count(),
            'growth_rate': round((qs['range_clients'].count() / max(clients.count(), 1)) * 100, 2),
            'top_clients': [
                {'client': item['client__name'], 'revenue': decimal_value(item['revenue'])}
                for item in invoices.values('client__name').annotate(revenue=Coalesce(Sum('payments__amount', filter=Q(payments__status=Payment.Status.COMPLETED)), Decimal('0.00'), output_field=DecimalField())).order_by('-revenue')[:10]
            ],
            'growth_trend': [
                {'date': item['date'].isoformat(), 'count': item['count']}
                for item in clients.annotate(date=TruncDate('created_at')).values('date').annotate(count=Count('id')).order_by('date')
            ],
        },
        'invoices': {
            'status_breakdown': list(invoices.values('status').annotate(count=Count('id')).order_by('status')),
            'overdue_count': invoices.filter(status=Invoice.Status.OVERDUE).count(),
            'paid_count': invoices.filter(status=Invoice.Status.PAID).count(),
        },
        'payments': {
            'completed': paid_payments.count(),
            'pending': qs['payments'].filter(status=Payment.Status.PENDING).count(),
            'failed': qs['payments'].filter(status=Payment.Status.FAILED).count(),
        },
    }


def report_rows(payload, report_type):
    if report_type == 'clients':
        return [['Client', 'Revenue'], *[[item['client'], item['revenue']] for item in payload['clients']['top_clients']]]
    if report_type == 'projects':
        return [['Metric', 'Value'], ['Active', payload['projects']['active']], ['Completed', payload['projects']['completed']], ['Delayed', payload['projects']['delayed']]]
    if report_type == 'invoices':
        return [['Status', 'Count'], *[[item['status'], item['count']] for item in payload['invoices']['status_breakdown']]]
    return [['Metric', 'Value'], ['Total Revenue', payload['revenue']['total_revenue']], ['Outstanding Revenue', payload['revenue']['outstanding_revenue']], ['Overdue Revenue', payload['revenue']['overdue_revenue']]]


def csv_response(rows, filename):
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="{filename}.csv"'
    writer = csv.writer(response)
    writer.writerows(rows)
    return response


def xlsx_response(rows, filename):
    shared_rows = ''.join(
        '<row>' + ''.join(f'<c t="inlineStr"><is><t>{escape(str(cell))}</t></is></c>' for cell in row) + '</row>'
        for row in rows
    )
    sheet = f'<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>{shared_rows}</sheetData></worksheet>'
    output = io.BytesIO()
    with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as workbook:
        workbook.writestr('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>')
        workbook.writestr('_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>')
        workbook.writestr('xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Report" sheetId="1" r:id="rId1"/></sheets></workbook>')
        workbook.writestr('xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>')
        workbook.writestr('xl/worksheets/sheet1.xml', sheet)
    response = HttpResponse(output.getvalue(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response['Content-Disposition'] = f'attachment; filename="{filename}.xlsx"'
    return response


def pdf_response(rows, filename):
    lines = ['ClientFlow Report', ''] + [' | '.join(map(str, row)) for row in rows]
    text = '\\n'.join(lines).replace('(', '[').replace(')', ']')
    stream = f'BT /F1 11 Tf 50 780 Td ({text[:3000]}) Tj ET'
    pdf = f'%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n3 0 obj << /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >> endobj\n4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n5 0 obj << /Length {len(stream)} >> stream\n{stream}\nendstream endobj\ntrailer << /Root 1 0 R >>\n%%EOF'
    response = HttpResponse(pdf.encode(), content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{filename}.pdf"'
    return response

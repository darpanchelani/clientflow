from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .utils import build_analytics_payload, csv_response, pdf_response, report_rows, xlsx_response


class AnalyticsDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(build_analytics_payload(request.user, request.query_params))


class RevenueAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(build_analytics_payload(request.user, request.query_params)['revenue'])


class SalesFunnelAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(build_analytics_payload(request.user, request.query_params)['sales_funnel'])


class ProjectAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(build_analytics_payload(request.user, request.query_params)['projects'])


class TaskAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(build_analytics_payload(request.user, request.query_params)['tasks'])


class ClientAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(build_analytics_payload(request.user, request.query_params)['clients'])


class ReportExportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        report_type = request.query_params.get('type', 'revenue')
        file_format = request.query_params.get('format', 'csv')
        payload = build_analytics_payload(request.user, request.query_params)
        rows = report_rows(payload, report_type)
        filename = f'clientflow-{report_type}-report'
        if file_format == 'xlsx':
            return xlsx_response(rows, filename)
        if file_format == 'pdf':
            return pdf_response(rows, filename)
        return csv_response(rows, filename)

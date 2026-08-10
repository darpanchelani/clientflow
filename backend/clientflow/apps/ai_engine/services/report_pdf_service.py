from textwrap import wrap


def _escape(value):
    return str(value or '').replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')


def _report_lines(report):
    lines = [
        'ClientFlow AI Report',
        report.title,
        f'Period: {report.period_start.isoformat()} to {report.period_end.isoformat()}',
        f'Confidence: {report.confidence.title()} | Business health: {report.health_score}/100',
        '',
        'Executive summary',
        *wrap(report.executive_summary, width=88),
        '',
        'Key metrics',
    ]
    for metric in report.key_metrics:
        lines.extend(wrap(f'{metric.get("label")}: {metric.get("value")} - {metric.get("context")}', width=88))
    lines.extend(['', 'Findings'])
    for finding in report.findings:
        lines.extend(wrap(f'{finding.get("title")}: {finding.get("detail")}', width=88))
        lines.extend(wrap(f'Evidence: {finding.get("evidence")}', width=88))
    lines.extend(['', 'Recommended actions'])
    for action in report.next_actions:
        lines.extend(wrap(f'{action.get("action")} ({action.get("priority")}): {action.get("rationale")}', width=88))
    lines.extend(['', 'Methodology', *wrap(report.methodology, width=88)])
    return lines


def generate_report_pdf(report):
    lines = _report_lines(report)
    page_height = max(792, 120 + (len(lines) * 14))
    y = page_height - 72
    commands = ['BT', '/F1 10 Tf', '14 TL']
    for index, line in enumerate(lines):
        if index == 0:
            commands.extend(['/F2 14 Tf', f'72 {y} Td', f'({_escape(line)}) Tj', '/F1 10 Tf'])
        elif index == 1:
            commands.extend(['0 -24 Td', '/F2 16 Tf', f'({_escape(line)}) Tj', '/F1 10 Tf'])
        else:
            commands.extend(['0 -14 Td', f'({_escape(line)}) Tj'])
    commands.append('ET')
    stream = '\n'.join(commands).encode('latin-1', errors='replace')
    objects = [
        b'<< /Type /Catalog /Pages 2 0 R >>',
        b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        f'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 {page_height}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>'.encode(),
        b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
        b'<< /Length ' + str(len(stream)).encode() + b' >>\nstream\n' + stream + b'\nendstream',
    ]
    output = bytearray(b'%PDF-1.4\n')
    offsets = []
    for index, obj in enumerate(objects, start=1):
        offsets.append(len(output))
        output.extend(f'{index} 0 obj\n'.encode())
        output.extend(obj)
        output.extend(b'\nendobj\n')
    xref = len(output)
    output.extend(f'xref\n0 {len(objects) + 1}\n'.encode())
    output.extend(b'0000000000 65535 f \n')
    for offset in offsets:
        output.extend(f'{offset:010d} 00000 n \n'.encode())
    output.extend(f'trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n'.encode())
    return bytes(output)

from textwrap import wrap

from django.utils import timezone


def _pdf_escape(value):
    return str(value or '').replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')


def _summary_lines(proposal):
    lines = [
        'ClientFlow Proposal',
        proposal.title,
        f'Status: {proposal.status.title()}',
        f'Type: {proposal.proposal_type.title()}',
        f'Created: {timezone.localtime(proposal.created_at).strftime("%Y-%m-%d %H:%M")}',
    ]
    if proposal.client_id:
        lines.append(f'Client: {proposal.client.name} ({proposal.client.email or "no email"})')
    if proposal.lead_id:
        lines.append(f'Lead: {proposal.lead.name} ({proposal.lead.email or "no email"})')
    if proposal.project_id:
        lines.append(f'Project: {proposal.project.name}')
    lines.append('')
    return lines


def _content_lines(proposal):
    lines = _summary_lines(proposal)
    for raw_line in proposal.generated_content.splitlines():
        if not raw_line.strip():
            lines.append('')
            continue
        lines.extend(wrap(raw_line, width=92, replace_whitespace=False) or [''])
    return lines


def _build_page_stream(lines, page_height):
    y = page_height - 72
    chunks = ['BT', '/F1 10 Tf', '14 TL']
    for index, line in enumerate(lines):
        if index == 0:
            chunks.extend(['/F2 14 Tf', f'72 {y} Td', f'({_pdf_escape(line)}) Tj', '/F1 10 Tf'])
        elif index == 1:
            chunks.extend(['0 -24 Td', '/F2 16 Tf', f'({_pdf_escape(line)}) Tj', '/F1 10 Tf'])
        else:
            chunks.extend(['0 -14 Td', f'({_pdf_escape(line)}) Tj'])
    chunks.append('ET')
    return '\n'.join(chunks).encode('latin-1', errors='replace')


def _objects_for_pdf(stream, page_height):
    return [
        b'<< /Type /Catalog /Pages 2 0 R >>',
        b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        f'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 {page_height}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>'.encode(),
        b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
        b'<< /Length ' + str(len(stream)).encode() + b' >>\nstream\n' + stream + b'\nendstream',
    ]


def generate_proposal_pdf(proposal):
    lines = _content_lines(proposal)
    page_height = max(792, 120 + (len(lines) * 14))
    stream = _build_page_stream(lines, page_height)
    objects = _objects_for_pdf(stream, page_height)
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
    output.extend(
        (
            f'trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n'
            f'startxref\n{xref}\n%%EOF\n'
        ).encode()
    )
    return bytes(output)

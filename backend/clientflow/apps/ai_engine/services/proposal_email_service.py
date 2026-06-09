from django.conf import settings
from django.core.mail import EmailMessage

from .proposal_pdf_service import generate_proposal_pdf


def send_proposal_email(*, proposal, to_email, subject, message='', attach_pdf=True):
    body = '\n\n'.join(
        part for part in [
            message.strip(),
            proposal.generated_content,
        ] if part
    )
    email = EmailMessage(
        subject=subject,
        body=body,
        from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
        to=[to_email],
    )
    if attach_pdf:
        email.attach(
            filename=f'proposal-{proposal.pk}.pdf',
            content=generate_proposal_pdf(proposal),
            mimetype='application/pdf',
        )
    email.send(fail_silently=False)

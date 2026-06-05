from .openai_service import OpenAIUnavailable, generate_openai_proposal
from .proposal_template_service import generate_template_proposal
from ..models import ProposalDraft
from ..serializers import ProposalDraftSerializer


def compact(value):
    return value.strip() if isinstance(value, str) else value


def summarize_lead(lead):
    if not lead:
        return ''
    return f'{lead.name}, company={lead.company}, email={lead.email}, source={lead.source}, status={lead.status}, score={lead.score}'


def summarize_client(client):
    if not client:
        return ''
    return f'{client.name}, company={client.company}, email={client.email}, status={client.status}'


def summarize_project(project):
    if not project:
        return ''
    return f'{project.name}, status={project.status}, start={project.start_date}, end={project.end_date}, description={project.description}'


def build_proposal_context(validated_data):
    lead = validated_data.get('lead')
    client = validated_data.get('client')
    project = validated_data.get('project')
    if project and not client:
        client = project.client

    return {
        'lead': lead,
        'client': client,
        'project': project,
        'lead_summary': summarize_lead(lead),
        'client_summary': summarize_client(client),
        'project_summary': summarize_project(project),
        'title': compact(validated_data['title']),
        'proposal_type': validated_data['proposal_type'],
        'estimated_budget': validated_data.get('estimated_budget'),
        'estimated_timeline': compact(validated_data.get('estimated_timeline', '')),
        'services_offered': compact(validated_data['services_offered']),
        'client_problem': compact(validated_data.get('client_problem', '')),
        'proposed_solution': compact(validated_data.get('proposed_solution', '')),
        'tone': validated_data.get('tone', 'professional'),
        'include_payment_terms': validated_data.get('include_payment_terms', True),
        'include_timeline': validated_data.get('include_timeline', True),
        'include_deliverables': validated_data.get('include_deliverables', True),
    }


def generate_proposal(*, user, validated_data):
    context = build_proposal_context(validated_data)
    source = 'openai'
    try:
        generated_content = generate_openai_proposal(context)
    except OpenAIUnavailable:
        source = 'template'
        generated_content = generate_template_proposal(context)

    draft = ProposalDraft.objects.create(
        user=user,
        lead=context.get('lead'),
        client=context.get('client'),
        project=context.get('project'),
        title=context['title'],
        generated_content=generated_content,
        status=ProposalDraft.Status.DRAFT,
        proposal_type=context['proposal_type'],
        estimated_budget=context.get('estimated_budget'),
        estimated_timeline=context.get('estimated_timeline') or '',
        services_offered=context['services_offered'],
        client_problem=context.get('client_problem') or '',
        proposed_solution=context.get('proposed_solution') or '',
    )
    draft.source = source
    data = ProposalDraftSerializer(draft).data
    data['source'] = source
    return data

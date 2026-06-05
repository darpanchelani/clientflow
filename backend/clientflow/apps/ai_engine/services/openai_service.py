import logging

from django.conf import settings


logger = logging.getLogger(__name__)


class OpenAIUnavailable(Exception):
    pass


def build_proposal_prompt(context):
    return (
        'Generate a professional client proposal using the following structured data. '
        'Return only the proposal content in Markdown with clear sections: Proposal Title, '
        'Client Introduction, Problem Understanding, Proposed Solution, Scope of Work, '
        'Deliverables, Timeline, Investment / Pricing, Payment Terms, Why Choose Us, '
        'Next Steps, and Closing Note.\n\n'
        f'Title: {context["title"]}\n'
        f'Tone: {context.get("tone", "professional")}\n'
        f'Proposal type: {context["proposal_type"]}\n'
        f'Services offered: {context["services_offered"]}\n'
        f'Client problem: {context.get("client_problem", "")}\n'
        f'Proposed solution: {context.get("proposed_solution", "")}\n'
        f'Estimated budget: {context.get("estimated_budget", "")}\n'
        f'Estimated timeline: {context.get("estimated_timeline", "")}\n'
        f'Lead context: {context.get("lead_summary", "")}\n'
        f'Client context: {context.get("client_summary", "")}\n'
        f'Project context: {context.get("project_summary", "")}\n'
        f'Include payment terms: {context.get("include_payment_terms", True)}\n'
        f'Include timeline: {context.get("include_timeline", True)}\n'
        f'Include deliverables: {context.get("include_deliverables", True)}\n'
    )


def generate_openai_proposal(context):
    api_key = getattr(settings, 'OPENAI_API_KEY', '')
    provider = getattr(settings, 'AI_PROPOSAL_PROVIDER', 'template')
    if not api_key or provider == 'template':
        raise OpenAIUnavailable('OpenAI proposal generation is not configured.')

    try:
        from openai import OpenAI
    except ImportError as exc:
        raise OpenAIUnavailable('OpenAI package is not installed.') from exc

    try:
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model=getattr(settings, 'OPENAI_MODEL', 'gpt-4o-mini'),
            messages=[
                {
                    'role': 'system',
                    'content': 'You generate concise, client-ready business proposals for a SaaS workflow platform.',
                },
                {'role': 'user', 'content': build_proposal_prompt(context)},
            ],
            temperature=0.4,
        )
        content = response.choices[0].message.content
    except Exception as exc:
        logger.warning('OpenAI proposal generation failed: %s', exc.__class__.__name__)
        raise OpenAIUnavailable('OpenAI proposal generation failed.') from exc

    if not content or not content.strip():
        raise OpenAIUnavailable('OpenAI returned empty proposal content.')
    return content.strip()

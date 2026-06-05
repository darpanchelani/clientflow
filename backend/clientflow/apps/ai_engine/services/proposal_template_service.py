from decimal import Decimal


TONE_OPENERS = {
    'professional': 'We appreciate the opportunity to present this proposal.',
    'friendly': 'Thank you for considering ClientFlow as a partner for this work.',
    'persuasive': 'This proposal outlines a practical path to move quickly from challenge to measurable results.',
    'formal': 'This document sets forth the proposed scope, approach, and commercial terms for the engagement.',
}


def money(value):
    if value in (None, ''):
        return 'To be finalized after scope confirmation'
    amount = Decimal(value)
    return f'${amount:,.2f}'


def entity_name(context):
    client = context.get('client')
    lead = context.get('lead')
    project = context.get('project')
    if client:
        return client.company or client.name
    if lead:
        return lead.company or lead.name
    if project:
        return project.client.company or project.client.name
    return 'your team'


def build_context_summary(context):
    parts = []
    lead = context.get('lead')
    client = context.get('client')
    project = context.get('project')
    if lead:
        parts.append(f'Lead: {lead.name} ({lead.email or "no email"}) from {lead.source}, currently {lead.status}.')
    if client:
        parts.append(f'Client: {client.name} at {client.company or client.name}, currently {client.status}.')
    if project:
        parts.append(f'Project: {project.name}, status {project.status}. {project.description}'.strip())
    return '\n'.join(parts)


def generate_template_proposal(context):
    title = context['title']
    tone = context.get('tone') or 'professional'
    services = context['services_offered'].strip()
    client_problem = context.get('client_problem') or (
        f'{entity_name(context)} needs a reliable execution plan that turns current requirements into a clear, manageable delivery process.'
    )
    proposed_solution = context.get('proposed_solution') or (
        'We will combine structured discovery, milestone-based delivery, transparent communication, and measurable acceptance criteria.'
    )
    timeline = context.get('estimated_timeline') or 'A detailed delivery schedule will be confirmed after kickoff.'
    budget = money(context.get('estimated_budget'))
    client_name = entity_name(context)
    opener = TONE_OPENERS.get(tone, TONE_OPENERS['professional'])
    context_summary = build_context_summary(context)

    sections = [
        f'# {title}',
        '## 1. Client Introduction',
        f'{opener} This proposal is prepared for {client_name} and is based on the information currently available in ClientFlow.',
    ]
    if context_summary:
        sections.append(context_summary)

    sections.extend(
        [
            '## 2. Problem Understanding',
            client_problem,
            '## 3. Proposed Solution',
            proposed_solution,
            '## 4. Scope of Work',
            services,
        ]
    )

    if context.get('include_deliverables', True):
        deliverables = [item.strip() for item in services.replace(';', ',').split(',') if item.strip()]
        if not deliverables:
            deliverables = [services]
        sections.extend(
            [
                '## 5. Deliverables',
                '\n'.join(f'- {item}' for item in deliverables),
            ]
        )

    if context.get('include_timeline', True):
        sections.extend(
            [
                '## 6. Timeline',
                timeline,
            ]
        )

    sections.extend(
        [
            '## 7. Investment / Pricing',
            f'Estimated investment: {budget}. This estimate is based on the current scope and may be adjusted if requirements materially change.',
        ]
    )

    if context.get('include_payment_terms', True):
        sections.extend(
            [
                '## 8. Payment Terms',
                'Recommended terms are 50% due at approval and 50% due upon final delivery, unless a different billing schedule is agreed in writing.',
            ]
        )

    sections.extend(
        [
            '## 9. Why Choose Us',
            'ClientFlow supports disciplined delivery through organized client records, project tracking, billing visibility, and workflow automation. This helps keep the engagement transparent from kickoff through completion.',
            '## 10. Next Steps',
            'Review this proposal, confirm scope and commercial terms, then approve the draft so the team can schedule kickoff and begin delivery.',
            '## 11. Closing Note',
            f'We look forward to helping {client_name} achieve the outcomes described in this proposal.',
        ]
    )

    return '\n\n'.join(sections)

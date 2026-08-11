# Security Policy

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability. Email the project
maintainer at `darpanchelani12@gmail.com` with the affected component, impact,
reproduction steps, and any suggested mitigation. Avoid accessing data that is
not yours and stop testing once impact is demonstrated.

The maintainer should acknowledge a report within three business days, provide
an initial assessment within seven business days, and coordinate disclosure
after a fix is available. These are response targets, not a bug-bounty offer.

## Supported version

Security fixes target the current default branch. This portfolio repository
does not currently publish long-term-support release lines.

## Deployment requirements

Production operators must provide a strong `SECRET_KEY`, HTTPS, restricted
hosts and CORS origins, managed secrets, encrypted backups, dependency scanning,
centralized monitoring, and independent security testing. The application does
not become compliant merely by enabling a settings flag. Deployment owners must
record and review evidence for each of these controls before release.

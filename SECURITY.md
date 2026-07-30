# Security and Privacy

## Home address

This is a public repository for software used at a private residence. Never commit the host's home address, private Firebase credentials, administrative access codes, or private event configuration to the repository.

The game must follow these rules:

1. Address visibility is off by default.
2. Only the host can enable or disable address display.
3. Public screens show the address only while the event is open and the visibility control is enabled.
4. The closed-event screen does not reveal the address.
5. Production address data belongs in protected runtime configuration, not public JavaScript or JSON files.

## Firebase

When Firebase is added:

- Commit only browser-safe public project configuration where appropriate.
- Never commit service-account keys or administrative credentials.
- Use Firebase Security Rules to restrict host-only writes.
- Validate room codes, nicknames, team sizes, answers, and score changes server-side or through trusted host controls.

## Reporting concerns

Until a formal reporting workflow is added, security and privacy concerns should be opened as a private communication with the repository owner rather than posted with sensitive details in a public issue.

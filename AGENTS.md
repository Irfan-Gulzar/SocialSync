# Project

Custom unified social inbox dashboard.

Current integrations:

- Facebook Messenger
- Instagram Messaging
- WhatsApp

Future:

- TikTok

# Architecture rules

- Follow existing backend/controller/service/repository patterns.
- Keep provider-specific logic under integrations/providers where possible.
- Normalize external messages before storing them.
- Keep external platform IDs separate from internal DB IDs.
- Webhook handlers must be idempotent.
- Never expose .env secrets.
- Never log access tokens or app secrets.
- Verify Meta webhook signatures.
- Do not modify unrelated frontend components.
- Do not introduce infrastructure without justification.

# Validation

Before completing a change:

- run typecheck
- run lint
- run relevant tests
- review the diff
- verify no secrets were committed

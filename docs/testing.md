# Testing and demonstration

## Automated validation

Run from the project root:

```powershell
npm test --prefix backend
npm run build --prefix frontend
```

During the September 2026 cleanup, all **25 backend tests passed** and the **Vite production build passed**, using Node.js 22.14.0 and npm 10.9.2.

`npm run lint` and `npm run typecheck` were attempted in both packages. Neither script is configured, so neither check passed or ran an analyzer. A successful frontend build verifies bundling, not TypeScript checking or browser behavior.

| Suite | Coverage |
| --- | --- |
| `facebookService.test.js` | Outbound endpoint, authorization configuration, validation |
| `instagramService.test.js` | Instagram Login text sending and configuration validation |
| `metaEventParser.test.js` | Text, attachments, echoes/statuses, postbacks, account filtering, batches, malformed events |
| `metaSignature.test.js` | Raw-body HMAC validation, Instagram secret selection, invalid signatures |
| `inboundMessageService.test.js` | Transaction ordering, duplicate suppression, simulated concurrent duplicates, rollback |
| `webhookController.test.js` | Verification tokens, missing-token rejection, ignored events, processing failures |
| `webhookRoutes.test.js` | Local HTTP signature enforcement, malformed JSON, removed WhatsApp routes |

The tests use injected HTTP/database doubles and synthetic fixtures. They do not send real platform messages or validate SQL against a live PostgreSQL server. No live Meta account, database migration, browser session, or seed execution was exercised during cleanup.

## Professor demonstration

1. Start PostgreSQL, the backend, and frontend using the [README](../README.md). For a data-only presentation, prepare a disposable seeded database beforehand.
2. Explain the problem: operators switch among social inboxes; this project stores messages in one normalized format while preserving their source platform.
3. Open Overview. Show message totals, response rate, platform distribution, current-week activity, and the latest-query shortcuts. Explain that response rate measures conversations with any agent reply.
4. Select a platform and conversation. Show persisted history and customer/agent message alignment. Identify seeded WhatsApp/TikTok rows as fictional UI demonstrations.
5. For a live demonstration, configure Meta first and send a new message from an eligible test account to the connected Facebook Page or Instagram professional account. Show the new conversation/message arriving without refresh.
6. Reply to that real conversation from SocialSync and verify receipt in the customer's app. Seeded IDs cannot be used for this step.
7. Send an attachment to show its text placeholder and explain that the database stores metadata, not the downloaded file.
8. Walk through the architecture diagram and tests: signature verification, normalization, transaction, unique deduplication key, commit, then socket notification.
9. Finish by identifying unfinished work: authentication, remaining integrations, media support, persistent unread state, and the Social Bot placeholder.

The demo steps above are a manual acceptance checklist, not a claim that they were executed during cleanup.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Empty dashboard | Backend running, correct `DB_*` values, schema applied, and actual or seeded messages present |
| API proxy connection refused | Backend on port 5000; Vite proxy targets match any port change |
| Database relation/column/index errors | Fresh schema or both migrations applied to the database named in `.env` |
| Callback verification returns 403 | Shared verification token matches the configured Meta callback token |
| Event POST returns 403 | Correct provider app secret and unmodified request bytes |
| Event POST returns 503 | Required signing secret is configured |
| Valid events produce no rows | Receiving account ID matches `FB_PAGE_ID` or `IG_PAGE_ID`; event is not an echo/status/unsupported event |
| Reply returns 502 | Real recipient, correct provider token, account configuration, permissions, and provider messaging eligibility |
| WhatsApp/TikTok reply rejected | These providers are future work |
| Icons/fonts missing offline | The HTML loads Sora and Material Symbols from Google Fonts |
| Unread badges reset | Counts exist only in browser memory |

## Review boundaries

The cleanup retains lockfiles, migrations, fixtures, working components, and the optional seed because each supports installation, upgrades, validation, or demonstration. Removed material includes obsolete design exports/plans, unused code and CSS, and the unfinished WhatsApp backend path. Existing local configuration and database contents were preserved.

There was no Git repository to inspect for staged files or historical secrets. Publication checks therefore apply to the current source tree and ignore rules; history must be checked separately if these files are later added to an existing repository.

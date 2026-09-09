# Facebook Messenger and Instagram webhooks

This guide describes the integration implemented in this repository. Complete local setup in the [README](../README.md) first. Account provisioning and permission approval are external prerequisites; the application does not implement account onboarding.

## Configuration

Use `backend/.env.example` as the configuration reference. Keep actual values in `backend/.env` only.

| Variable | Purpose |
| --- | --- |
| `WEBHOOK_VERIFY_TOKEN` | Shared callback verification token chosen by you |
| `META_VERIFY_TOKEN` | Optional legacy alias, used when the preferred variable is absent |
| `META_APP_SECRET` | Messenger webhook signing secret; also the Instagram fallback |
| `FB_PAGE_ID` | Facebook Page ID; outbound sender and inbound account filter |
| `FB_PAGE_ACCESS_TOKEN` | Facebook Page token for replies |
| `FB_GRAPH_API_VERSION` | Optional outbound version override; source default is `v26.0` |
| `IG_APP_SECRET` | Instagram webhook signing secret for a separate Instagram application |
| `IG_PAGE_ID` | Instagram professional account ID for filtering incoming events |
| `IG_PAGE_ACCESS_TOKEN` | Instagram access token used by the Instagram Login sender |
| `IG_GRAPH_API_VERSION` | Optional outbound version override; source default is `v26.0` |

`IG_PAGE_ID` and `IG_PAGE_ACCESS_TOKEN` are legacy variable names. The sender actually calls `graph.instagram.com/<version>/me/messages`. Configure credentials for that Instagram Login flow. The backend does not read `META_APP_ID` or WhatsApp token settings.

Meta documents separate Instagram Login and Facebook Login API collections. Use the collection matching this sender when provisioning credentials. See [Meta's Instagram API collection](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api).

The API-version defaults above describe the code, not a claim about the latest supported provider version. Verify account access, current permissions, app review requirements, and messaging eligibility in the provider's setup tools before a live demo.

## Public callback

The shared endpoint is:

```text
GET/POST https://<public-host>/webhooks/meta
```

For local development, run the backend on port 5000 and use an installed HTTPS tunnel, for example:

```powershell
ngrok http 5000
```

Set the callback in your Meta app to the tunnel's HTTPS origin followed by `/webhooks/meta`, and set its verification token to the value configured locally. Subscribe the intended account to incoming message events using the setup flow for its provider. Update the callback if the tunnel hostname changes.

A tunnel to the entire backend also exposes the unauthenticated `/api` and Socket.IO endpoints. Use an empty/disposable database for that arrangement, or restrict public routing to `/webhooks/meta` and keep dashboard access private.

## Verification behavior

The GET handshake accepts `hub.mode=subscribe` only when `hub.verify_token` equals a nonempty configured token. It returns `hub.challenge` on success, otherwise HTTP 403.

POST signatures use `X-Hub-Signature-256` and HMAC-SHA256 over the exact request bytes. `page` payloads use `META_APP_SECRET`; `instagram` payloads use `IG_APP_SECRET` if available, otherwise `META_APP_SECRET`. Do not reformat a signed body between calculating the digest and sending it.

The parser supports the `entry[].messaging[]` structure for `page` and `instagram` objects. Configured receiving account IDs filter unrelated entries. Messages and postbacks are normalized; echoes/self events and unsupported/status events are acknowledged without persistence.

## Local checks

The automated webhook tests start their own HTTP server, use synthetic signatures, and require no public tunnel:

```powershell
npm test --prefix backend
```

For a live check, start both application services and open `http://localhost:3000`. Send a new DM from an account eligible to test your provider app, select Facebook or Instagram in the sidebar, and confirm the message appears. Reply from that real thread and verify receipt in the customer's app. A media-only inbound message should show a placeholder such as `[Image attachment]`.

Live account delivery was not tested during cleanup. The [demonstration guide](testing.md) provides the acceptance checklist and troubleshooting steps.

## Reliability and limits

Each supported event is persisted in a transaction. A unique database key suppresses duplicate deliveries. Realtime notifications happen after commit, and conversation timestamps never move backward for older events. A failed event causes HTTP 500 so a retry can be requested; already-stored messages remain deduplicated.

The current integration supports one Facebook Page and one Instagram professional account. It does not download media, enrich profiles, import message history, persist delivery/read state, or reconcile messages sent outside the dashboard. WhatsApp and TikTok remain future work.

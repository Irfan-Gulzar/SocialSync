# API reference

The development backend base URL is `http://localhost:5000`. The frontend calls relative `/api` URLs through Vite. Dashboard endpoints currently have no authentication and are intended for a trusted demonstration environment.

## REST endpoints

| Method | Path | Result |
| --- | --- | --- |
| GET | `/` | Plain text server-running message; does not check the database |
| GET | `/api/conversations` | All conversations, most recently active first |
| GET | `/api/conversations/:id/messages` | Stored thread ordered oldest first |
| POST | `/api/conversations/:id/reply` | Sends a provider text reply and stores the resulting agent message |
| GET | `/api/stats` | Aggregate database metrics |
| GET | `/webhooks/meta` | Provider verification handshake |
| POST | `/webhooks/meta` | Signed Facebook/Instagram event batch |

There are no WhatsApp or TikTok endpoints. API route IDs are internal numeric conversation IDs, not Facebook/Instagram identifiers. List endpoints are not paginated.

## Conversations and messages

`GET /api/conversations` returns an array with `id`, `customer_id`, `platform`, `last_message_at`, `created_at`, `customer_name`, and `platform_customer_id`.

`GET /api/conversations/:id/messages` returns an array with `id`, `conversation_id`, `sender_type`, `content`, `platform_message_id`, `deduplication_key`, `message_type`, `attachments`, `reply_to_platform_message_id`, and `created_at`. Missing threads return an empty array; this endpoint does not separately validate conversation existence. Names and some metadata may be null.

## Send a reply

```http
POST /api/conversations/1/reply
Content-Type: application/json

{"text":"Thank you for your message. How can we help?"}
```

The property is `text`. A successful HTTP 201 response contains the stored message row. The recipient is looked up from the conversation's customer, never accepted from the request body.

| Status | Meaning |
| --- | --- |
| 201 | Provider accepted the reply and the message was stored |
| 400 | Missing/blank/non-string text, or unsupported platform |
| 404 | Conversation was not found |
| 502 | Provider request or provider configuration failed |

An accepted reply is not a delivery/read receipt. Avoid retrying blindly after an uncertain failure because outbound operations are not idempotent. Malformed IDs and database failures do not yet have a complete validation/error contract.

## Statistics

`GET /api/stats` returns `totalMessages`, `totalConversations`, `messagesLast24h`, `activeSessionsLast24h`, `responseRate`, `perPlatform`, `weeklyAnalytics`, and `latestQueries`.

`perPlatform` maps platform names to integer message counts; absent platforms may be omitted. `weeklyAnalytics` maps `YYYY-MM-DD` dates to counts for `facebook`, `instagram`, `whatsapp`, and `tiktok`. These categories include fictional seed data and do not imply live integrations. See [metric definitions](architecture.md#analytics-definitions).

## Webhook handshake and events

GET parameters: `hub.mode=subscribe`, `hub.verify_token`, and `hub.challenge`. A matching configured verification token returns the challenge with HTTP 200; otherwise the response is 403. `WEBHOOK_VERIFY_TOKEN` takes precedence over the legacy `META_VERIFY_TOKEN` alias.

POST requests need `Content-Type: application/json` and `X-Hub-Signature-256: sha256=<hex digest>`. The digest is HMAC-SHA256 over the exact body bytes using the applicable app secret. JSON bodies are limited to 1 MB.

| Status | Meaning |
| --- | --- |
| 200 | Batch processed, duplicated, empty, or safely ignored |
| 400 | Signed body contains malformed JSON |
| 403 | Signature missing, malformed, or invalid |
| 503 | Signing secret unavailable |
| 500 | A recognized event could not be persisted, or another unhandled error occurred |

The generic error handler currently maps some parser errors, including oversized bodies, to HTTP 500. Do not assume a separate HTTP 413 contract.

## Socket.IO

Connect to the backend origin using Socket.IO, with its default `/socket.io` path. The server emits `new_message` only after committing a new inbound message:

```json
{
  "conversationId": 1,
  "messageId": 42,
  "platform": "facebook",
  "customerName": null,
  "text": "Hello!",
  "messageType": "text",
  "attachments": [],
  "createdAt": "2026-09-10T10:00:00.000Z"
}
```

This is an illustrative payload. All connected clients receive the event. Duplicate webhook deliveries do not produce another event. There is no socket authentication, per-user room, event history, or outbound-reply broadcast.

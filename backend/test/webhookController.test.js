const test = require('node:test');
const assert = require('node:assert/strict');
const {
  verifyMetaWebhook,
  createMetaWebhookHandler,
} = require('../src/controllers/webhookController');

function responseRecorder() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(body) {
      this.body = body;
      return this;
    },
    sendStatus(code) {
      this.statusCode = code;
      this.body = String(code);
      return this;
    },
  };
}

test('verification accepts the preferred token and compatibility alias', () => {
  const originalPreferred = process.env.WEBHOOK_VERIFY_TOKEN;
  const originalAlias = process.env.META_VERIFY_TOKEN;

  process.env.WEBHOOK_VERIFY_TOKEN = 'preferred-token';
  process.env.META_VERIFY_TOKEN = 'alias-token';
  let response = responseRecorder();
  verifyMetaWebhook(
    {
      query: {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'preferred-token',
        'hub.challenge': 'challenge',
      },
    },
    response
  );
  assert.equal(response.statusCode, 200);
  assert.equal(response.body, 'challenge');

  delete process.env.WEBHOOK_VERIFY_TOKEN;
  response = responseRecorder();
  verifyMetaWebhook(
    {
      query: {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'alias-token',
        'hub.challenge': 'alias-challenge',
      },
    },
    response
  );
  assert.equal(response.statusCode, 200);
  assert.equal(response.body, 'alias-challenge');

  if (originalPreferred === undefined) delete process.env.WEBHOOK_VERIFY_TOKEN;
  else process.env.WEBHOOK_VERIFY_TOKEN = originalPreferred;
  if (originalAlias === undefined) delete process.env.META_VERIFY_TOKEN;
  else process.env.META_VERIFY_TOKEN = originalAlias;
});

test('verification rejects a missing server token even when the request omits its token', () => {
  const originalPreferred = process.env.WEBHOOK_VERIFY_TOKEN;
  const originalAlias = process.env.META_VERIFY_TOKEN;
  delete process.env.WEBHOOK_VERIFY_TOKEN;
  delete process.env.META_VERIFY_TOKEN;

  try {
    const response = responseRecorder();
    verifyMetaWebhook(
      { query: { 'hub.mode': 'subscribe', 'hub.challenge': 'challenge' } },
      response
    );
    assert.equal(response.statusCode, 403);
  } finally {
    if (originalPreferred !== undefined) process.env.WEBHOOK_VERIFY_TOKEN = originalPreferred;
    if (originalAlias !== undefined) process.env.META_VERIFY_TOKEN = originalAlias;
  }
});

test('verification rejects an incorrect token', () => {
  const response = responseRecorder();
  verifyMetaWebhook(
    {
      query: {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'incorrect',
        'hub.challenge': 'challenge',
      },
    },
    response
  );
  assert.equal(response.statusCode, 403);
});

test('unknown events are acknowledged and recognized failures request a retry', async () => {
  const ignoredHandler = createMetaWebhookHandler({
    parseMetaWebhook() {
      return [
        {
          processable: false,
          platform: 'facebook',
          eventType: 'unknown',
          reason: 'unsupported_event',
        },
      ];
    },
  });
  let response = responseRecorder();
  await ignoredHandler({ body: { object: 'page', entry: [] } }, response);
  assert.equal(response.statusCode, 200);

  const failedHandler = createMetaWebhookHandler({
    parseMetaWebhook() {
      return [{ processable: true, platform: 'facebook', eventType: 'message' }];
    },
    async processInboundMessage() {
      throw new Error('database unavailable');
    },
  });
  response = responseRecorder();
  await failedHandler({ body: { object: 'page', entry: [{}] } }, response);
  assert.equal(response.statusCode, 500);
});

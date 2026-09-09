const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createInstagramService,
} = require('../src/services/instagramService');

test('sends Instagram text replies through the Instagram Login Send API', async () => {
  const calls = [];
  const service = createInstagramService({
    env: {
      IG_PAGE_ACCESS_TOKEN: 'unit-test-access-token',
      IG_GRAPH_API_VERSION: 'v26.0',
    },
    httpClient: {
      async post(...args) {
        calls.push(args);
        return { data: { message_id: 'outbound-message-id' } };
      },
    },
  });

  const result = await service.sendMessage('instagram-scoped-id', ' Hello ');

  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'https://graph.instagram.com/v26.0/me/messages');
  assert.deepEqual(calls[0][1], {
    recipient: { id: 'instagram-scoped-id' },
    message: { text: 'Hello' },
  });
  assert.equal(
    calls[0][2].headers.Authorization,
    'Bearer unit-test-access-token'
  );
  assert.equal(result.message_id, 'outbound-message-id');
});

test('rejects missing credentials and malformed API versions', async () => {
  const missingToken = createInstagramService({ env: {}, httpClient: {} });
  await assert.rejects(
    missingToken.sendMessage('recipient', 'Hello'),
    { code: 'INSTAGRAM_CONFIGURATION_ERROR' }
  );

  const invalidVersion = createInstagramService({
    env: {
      IG_PAGE_ACCESS_TOKEN: 'unit-test-access-token',
      IG_GRAPH_API_VERSION: 'latest',
    },
    httpClient: {},
  });
  await assert.rejects(
    invalidVersion.sendMessage('recipient', 'Hello'),
    { code: 'INSTAGRAM_CONFIGURATION_ERROR' }
  );
});

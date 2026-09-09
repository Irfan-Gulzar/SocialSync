const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createFacebookService,
} = require('../src/services/facebookService');

test('sends Facebook replies through the Messenger Send API', async () => {
  const calls = [];
  const service = createFacebookService({
    env: {
      FB_PAGE_ID: 'page-id',
      FB_PAGE_ACCESS_TOKEN: 'unit-test-access-token',
      FB_GRAPH_API_VERSION: 'v26.0',
    },
    httpClient: {
      async post(...args) {
        calls.push(args);
        return { data: { message_id: 'outbound-message-id' } };
      },
    },
  });

  const result = await service.sendMessage('page-scoped-user-id', ' Hello ');

  assert.equal(calls.length, 1);
  assert.equal(
    calls[0][0],
    'https://graph.facebook.com/v26.0/page-id/messages'
  );
  assert.deepEqual(calls[0][1], {
    recipient: { id: 'page-scoped-user-id' },
    messaging_type: 'RESPONSE',
    message: { text: 'Hello' },
  });
  assert.equal(
    calls[0][2].headers.Authorization,
    'Bearer unit-test-access-token'
  );
  assert.equal(calls[0][2].timeout, 15000);
  assert.equal(result.message_id, 'outbound-message-id');
});

test('rejects missing Facebook credentials', async () => {
  const missingPageId = createFacebookService({
    env: { FB_PAGE_ACCESS_TOKEN: 'unit-test-access-token' },
    httpClient: {},
  });
  await assert.rejects(
    missingPageId.sendMessage('recipient', 'Hello'),
    { code: 'FACEBOOK_CONFIGURATION_ERROR' }
  );

  const missingToken = createFacebookService({
    env: { FB_PAGE_ID: 'page-id' },
    httpClient: {},
  });
  await assert.rejects(
    missingToken.sendMessage('recipient', 'Hello'),
    { code: 'FACEBOOK_CONFIGURATION_ERROR' }
  );
});

test('rejects malformed API versions and invalid messages', async () => {
  const invalidVersion = createFacebookService({
    env: {
      FB_PAGE_ID: 'page-id',
      FB_PAGE_ACCESS_TOKEN: 'unit-test-access-token',
      FB_GRAPH_API_VERSION: 'latest',
    },
    httpClient: {},
  });
  await assert.rejects(
    invalidVersion.sendMessage('recipient', 'Hello'),
    { code: 'FACEBOOK_CONFIGURATION_ERROR' }
  );

  const invalidMessage = createFacebookService({
    env: {
      FB_PAGE_ID: 'page-id',
      FB_PAGE_ACCESS_TOKEN: 'unit-test-access-token',
    },
    httpClient: {},
  });
  await assert.rejects(
    invalidMessage.sendMessage('', 'Hello'),
    { code: 'FACEBOOK_MESSAGE_INVALID' }
  );
  await assert.rejects(
    invalidMessage.sendMessage('recipient', '   '),
    { code: 'FACEBOOK_MESSAGE_INVALID' }
  );
});

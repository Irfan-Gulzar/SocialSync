const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('../src/app');
const {
  createMetaSignature,
} = require('../src/integrations/providers/meta/metaSignature');

let server;
let baseUrl;
let originalSecret;

test.before(async () => {
  originalSecret = process.env.META_APP_SECRET;
  process.env.META_APP_SECRET = 'route-test-secret';
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  if (originalSecret === undefined) delete process.env.META_APP_SECRET;
  else process.env.META_APP_SECRET = originalSecret;
});

test('unfinished WhatsApp webhook routes are not exposed', async () => {
  for (const method of ['GET', 'POST']) {
    const response = await fetch(`${baseUrl}/webhooks/whatsapp`, { method });
    assert.equal(response.status, 404);
  }
});

test('accepts a valid signed empty Meta batch', async () => {
  const body = JSON.stringify({ object: 'page', entry: [] });
  const response = await fetch(`${baseUrl}/webhooks/meta`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-hub-signature-256': createMetaSignature(
        Buffer.from(body),
        process.env.META_APP_SECRET
      ),
    },
    body,
  });
  assert.equal(response.status, 200);
});

test('rejects missing and invalid signatures', async () => {
  const body = JSON.stringify({ object: 'page', entry: [] });
  let response = await fetch(`${baseUrl}/webhooks/meta`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  });
  assert.equal(response.status, 403);

  response = await fetch(`${baseUrl}/webhooks/meta`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-hub-signature-256': `sha256=${'0'.repeat(64)}`,
    },
    body,
  });
  assert.equal(response.status, 403);
});

test('rejects malformed JSON after validating its raw signature', async () => {
  const body = '{"object":"page","entry":[';
  const response = await fetch(`${baseUrl}/webhooks/meta`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-hub-signature-256': createMetaSignature(
        Buffer.from(body),
        process.env.META_APP_SECRET
      ),
    },
    body,
  });
  assert.equal(response.status, 400);
});

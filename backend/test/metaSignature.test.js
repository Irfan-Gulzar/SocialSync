const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createMetaSignature,
  verifyMetaRequestSignature,
} = require('../src/integrations/providers/meta/metaSignature');

function requestWithSignature(signature) {
  return {
    get(name) {
      return name.toLowerCase() === 'x-hub-signature-256' ? signature : undefined;
    },
  };
}

test('accepts a valid signature calculated over the raw body', () => {
  const originalSecret = process.env.META_APP_SECRET;
  process.env.META_APP_SECRET = 'unit-test-secret';
  const rawBody = Buffer.from('{"text":"Unicode ä"}');
  const signature = createMetaSignature(rawBody, process.env.META_APP_SECRET);

  assert.doesNotThrow(() =>
    verifyMetaRequestSignature(requestWithSignature(signature), null, rawBody)
  );
  if (originalSecret === undefined) delete process.env.META_APP_SECRET;
  else process.env.META_APP_SECRET = originalSecret;
});

test('uses the Instagram app secret for Instagram webhook objects', () => {
  const originalMetaSecret = process.env.META_APP_SECRET;
  const originalInstagramSecret = process.env.IG_APP_SECRET;
  process.env.META_APP_SECRET = 'meta-unit-test-secret';
  process.env.IG_APP_SECRET = 'instagram-unit-test-secret';
  const rawBody = Buffer.from('{"object":"instagram","entry":[]}');
  const signature = createMetaSignature(rawBody, process.env.IG_APP_SECRET);

  assert.doesNotThrow(() =>
    verifyMetaRequestSignature(requestWithSignature(signature), null, rawBody)
  );
  assert.throws(
    () =>
      verifyMetaRequestSignature(
        requestWithSignature(
          createMetaSignature(rawBody, process.env.META_APP_SECRET)
        ),
        null,
        rawBody
      ),
    { code: 'META_SIGNATURE_INVALID', status: 403 }
  );

  if (originalMetaSecret === undefined) delete process.env.META_APP_SECRET;
  else process.env.META_APP_SECRET = originalMetaSecret;
  if (originalInstagramSecret === undefined) delete process.env.IG_APP_SECRET;
  else process.env.IG_APP_SECRET = originalInstagramSecret;
});

test('rejects missing and invalid signatures', () => {
  const originalSecret = process.env.META_APP_SECRET;
  process.env.META_APP_SECRET = 'unit-test-secret';
  const rawBody = Buffer.from('{}');

  assert.throws(
    () => verifyMetaRequestSignature(requestWithSignature(undefined), null, rawBody),
    { code: 'META_SIGNATURE_INVALID', status: 403 }
  );
  assert.throws(
    () =>
      verifyMetaRequestSignature(
        requestWithSignature(`sha256=${'0'.repeat(64)}`),
        null,
        rawBody
      ),
    { code: 'META_SIGNATURE_INVALID', status: 403 }
  );
  if (originalSecret === undefined) delete process.env.META_APP_SECRET;
  else process.env.META_APP_SECRET = originalSecret;
});

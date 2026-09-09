const test = require('node:test');
const assert = require('node:assert/strict');
const messengerFixture = require('./fixtures/meta/messenger-message.json');
const instagramFixture = require('./fixtures/meta/instagram-message.json');
const {
  parseMetaWebhook,
} = require('../src/integrations/providers/meta/metaEventParser');

test('normalizes an inbound Messenger text message', () => {
  const [event] = parseMetaWebhook(messengerFixture, { facebook: 'PAGE_123' });

  assert.equal(event.processable, true);
  assert.equal(event.platform, 'facebook');
  assert.equal(event.customerExternalId, 'PSID_456');
  assert.equal(event.externalMessageId, 'm_facebook_001');
  assert.equal(event.text, 'Hello from Messenger');
  assert.equal(event.messageType, 'text');
  assert.equal(event.deduplicationKey, 'meta:facebook:PAGE_123:m_facebook_001');
});

test('normalizes Instagram attachments and recognizes echoes and seen events', () => {
  const events = parseMetaWebhook(instagramFixture, { instagram: 'IG_123' });

  assert.equal(events.length, 3);
  assert.equal(events[0].processable, true);
  assert.equal(events[0].platform, 'instagram');
  assert.equal(events[0].messageType, 'image');
  assert.equal(events[0].text, '[Image attachment]');
  assert.equal(events[0].attachments[0].type, 'image');
  assert.equal(events[0].replyToExternalMessageId, 'm_instagram_original');
  assert.deepEqual(
    events.slice(1).map((event) => [event.eventType, event.reason]),
    [
      ['echo', 'outbound_echo'],
      ['read', 'status_event'],
    ]
  );
});

test('normalizes postbacks with a deterministic deduplication key', () => {
  const body = {
    object: 'page',
    entry: [
      {
        id: 'PAGE_123',
        messaging: [
          {
            sender: { id: 'PSID_456' },
            recipient: { id: 'PAGE_123' },
            timestamp: 1710000200000,
            postback: { title: 'Get Started', payload: 'GET_STARTED' },
          },
        ],
      },
    ],
  };

  const first = parseMetaWebhook(body, { facebook: 'PAGE_123' })[0];
  const second = parseMetaWebhook(body, { facebook: 'PAGE_123' })[0];
  assert.equal(first.processable, true);
  assert.equal(first.messageType, 'postback');
  assert.equal(first.text, 'Get Started');
  assert.equal(first.deduplicationKey, second.deduplicationKey);
});

test('iterates every messaging item and ignores mismatched accounts safely', () => {
  const multi = structuredClone(messengerFixture);
  multi.entry[0].messaging.push(
    structuredClone(messengerFixture.entry[0].messaging[0])
  );
  multi.entry[0].messaging[1].message.mid = 'm_facebook_002';

  assert.equal(
    parseMetaWebhook(multi, { facebook: 'PAGE_123' }).filter(
      (event) => event.processable
    ).length,
    2
  );

  const [mismatch] = parseMetaWebhook(messengerFixture, {
    facebook: 'ANOTHER_PAGE',
  });
  assert.equal(mismatch.processable, false);
  assert.equal(mismatch.reason, 'account_mismatch');
});

test('malformed and unknown events are acknowledged without throwing', () => {
  assert.doesNotThrow(() => parseMetaWebhook(null));
  assert.equal(parseMetaWebhook(null)[0].reason, 'malformed_payload');

  const events = parseMetaWebhook(
    {
      object: 'instagram',
      entry: [{ id: 'IG_123', messaging: [{ sender: { id: 'someone' } }] }],
    },
    { instagram: 'IG_123' }
  );
  assert.equal(events[0].eventType, 'unknown');
  assert.equal(events[0].processable, false);
});

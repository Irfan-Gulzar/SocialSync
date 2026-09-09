const test = require('node:test');
const assert = require('node:assert/strict');
const { processInboundMessage } = require('../src/services/inboundMessageService');

function normalizedMessage(overrides = {}) {
  return {
    platform: 'facebook',
    customerExternalId: 'PSID_456',
    customerName: null,
    externalMessageId: 'm_001',
    deduplicationKey: 'meta:facebook:PAGE_123:m_001',
    text: 'Hello',
    messageType: 'text',
    attachments: [],
    replyToExternalMessageId: null,
    timestamp: new Date('2026-08-15T00:00:00.000Z'),
    ...overrides,
  };
}

function fakeDependencies(createInbound) {
  const transactions = [];
  const touches = [];
  const emitted = [];
  const client = {
    async query(sql) {
      transactions.push(sql);
    },
    release() {
      transactions.push('RELEASE');
    },
  };

  return {
    dependencies: {
      pool: { async connect() { return client; } },
      Customer: {
        async findOrCreate() {
          return { id: 11, name: null };
        },
      },
      Conversation: {
        async findOrCreate() {
          return { id: 22 };
        },
        async touch(id, timestamp) {
          touches.push([id, timestamp]);
        },
      },
      Message: { createInbound },
      emitNewMessage(payload) {
        emitted.push(payload);
      },
    },
    transactions,
    touches,
    emitted,
  };
}

test('commits and emits only after inserting a new message', async () => {
  const fake = fakeDependencies(async () => ({
    id: 33,
    content: 'Hello',
    message_type: 'text',
    attachments: [],
    created_at: new Date('2026-08-15T00:00:00.000Z'),
  }));

  const result = await processInboundMessage(
    normalizedMessage(),
    fake.dependencies
  );

  assert.equal(result.status, 'processed');
  assert.deepEqual(fake.transactions, ['BEGIN', 'COMMIT', 'RELEASE']);
  assert.equal(fake.touches.length, 1);
  assert.equal(fake.emitted.length, 1);
  assert.equal(fake.emitted[0].conversationId, 22);
});

test('a duplicate does not touch the conversation or emit realtime data', async () => {
  const fake = fakeDependencies(async () => null);
  const result = await processInboundMessage(
    normalizedMessage(),
    fake.dependencies
  );

  assert.equal(result.status, 'duplicate');
  assert.deepEqual(fake.transactions, ['BEGIN', 'COMMIT', 'RELEASE']);
  assert.equal(fake.touches.length, 0);
  assert.equal(fake.emitted.length, 0);
});

test('concurrent duplicate deliveries result in one insert and one emit', async () => {
  let inserted = false;
  const createInbound = async () => {
    await new Promise((resolve) => setImmediate(resolve));
    if (inserted) return null;
    inserted = true;
    return {
      id: 33,
      content: 'Hello',
      message_type: 'text',
      attachments: [],
      created_at: new Date('2026-08-15T00:00:00.000Z'),
    };
  };
  const first = fakeDependencies(createInbound);
  const second = fakeDependencies(createInbound);

  const results = await Promise.all([
    processInboundMessage(normalizedMessage(), first.dependencies),
    processInboundMessage(normalizedMessage(), second.dependencies),
  ]);

  assert.deepEqual(
    results.map((result) => result.status).sort(),
    ['duplicate', 'processed']
  );
  assert.equal(first.emitted.length + second.emitted.length, 1);
  assert.equal(first.touches.length + second.touches.length, 1);
});

test('rolls back when persistence fails', async () => {
  const fake = fakeDependencies(async () => {
    throw new Error('database unavailable');
  });

  await assert.rejects(
    processInboundMessage(normalizedMessage(), fake.dependencies),
    /database unavailable/
  );
  assert.deepEqual(fake.transactions, ['BEGIN', 'ROLLBACK', 'RELEASE']);
  assert.equal(fake.emitted.length, 0);
});

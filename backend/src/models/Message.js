const pool = require('../config/db');

// Insert a new message (from customer or agent)
async function create(conversationId, senderType, content, platformMessageId = null) {
  const result = await pool.query(
    `INSERT INTO messages (conversation_id, sender_type, content, platform_message_id)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [conversationId, senderType, content, platformMessageId]
  );
  return result.rows[0];
}

// Atomically insert a normalized inbound message. A retry with the same
// deduplication key returns null instead of creating a second row.
async function createInbound(message, executor = pool) {
  const result = await executor.query(
    `INSERT INTO messages (
       conversation_id,
       sender_type,
       content,
       platform_message_id,
       deduplication_key,
       message_type,
       attachments,
       reply_to_platform_message_id,
       created_at
     )
     VALUES ($1, 'customer', $2, $3, $4, $5, $6::jsonb, $7, $8)
     ON CONFLICT (deduplication_key) WHERE deduplication_key IS NOT NULL
     DO NOTHING
     RETURNING *`,
    [
      message.conversationId,
      message.content,
      message.platformMessageId,
      message.deduplicationKey,
      message.messageType,
      JSON.stringify(message.attachments || []),
      message.replyToPlatformMessageId,
      message.timestamp,
    ]
  );
  return result.rows[0] || null;
}

// Get all messages for a conversation, oldest first (for chat thread view)
async function findByConversation(conversationId) {
  const result = await pool.query(
    `SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
    [conversationId]
  );
  return result.rows;
}

module.exports = {
  create,
  createInbound,
  findByConversation,
};

const pool = require('../config/db');

// Get existing conversation or create one if it doesn't exist yet
async function findOrCreate(
  customerId,
  platform,
  executor = pool,
  initialTimestamp = new Date()
) {
  const result = await executor.query(
    `INSERT INTO conversations (customer_id, platform, last_message_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (customer_id, platform)
     DO UPDATE SET platform = EXCLUDED.platform
     RETURNING *`,
    [customerId, platform, initialTimestamp]
  );
  return result.rows[0];
}

// Update last_message_at whenever a new message arrives or is sent
async function touch(conversationId, timestamp = new Date(), executor = pool) {
  await executor.query(
    `UPDATE conversations
     SET last_message_at = GREATEST(COALESCE(last_message_at, $2), $2)
     WHERE id = $1`,
    [conversationId, timestamp]
  );
}

// List all conversations, most recently active first (for the dashboard inbox view)
async function listAll() {
  const result = await pool.query(
    `SELECT c.*, cu.name AS customer_name, cu.platform_customer_id
     FROM conversations c
     JOIN customers cu ON cu.id = c.customer_id
     ORDER BY c.last_message_at DESC NULLS LAST`
  );
  return result.rows;
}

module.exports = { findOrCreate, touch, listAll };

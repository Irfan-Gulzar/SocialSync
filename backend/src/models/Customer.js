const pool = require('../config/db');

// Get an existing customer or create one if it doesn't exist yet
async function findOrCreate(
  platform,
  platformCustomerId,
  name,
  executor = pool
) {
  const result = await executor.query(
    `INSERT INTO customers (platform, platform_customer_id, name)
     VALUES ($1, $2, $3)
     ON CONFLICT (platform, platform_customer_id)
     DO UPDATE SET name = COALESCE(customers.name, EXCLUDED.name)
     RETURNING *`,
    [platform, platformCustomerId, name]
  );
  return result.rows[0];
}

module.exports = { findOrCreate };

const pool = require('../config/db');

/**
 * GET /api/stats
 * Returns aggregated analytics computed from the database:
 *   - totalMessages, totalConversations
 *   - messagesLast24h, activeSessionsLast24h
 *   - responseRate (% of conversations with at least one agent reply)
 *   - perPlatform breakdown (message count per platform)
 *   - weeklyAnalytics (messages per day per platform for the current Mon-Sun week)
 */
async function getStats(req, res) {
  try {
    // 1. Total messages
    const totalMsgResult = await pool.query('SELECT COUNT(*) AS count FROM messages');
    const totalMessages = parseInt(totalMsgResult.rows[0].count, 10);

    // 2. Total conversations
    const totalConvResult = await pool.query('SELECT COUNT(*) AS count FROM conversations');
    const totalConversations = parseInt(totalConvResult.rows[0].count, 10);

    // 3. Messages in last 24 hours
    const msg24hResult = await pool.query(
      "SELECT COUNT(*) AS count FROM messages WHERE created_at >= NOW() - INTERVAL '24 hours'"
    );
    const messagesLast24h = parseInt(msg24hResult.rows[0].count, 10);

    // 4. Active sessions in last 24 hours (conversations with recent activity)
    const activeSessions24hResult = await pool.query(
      "SELECT COUNT(*) AS count FROM conversations WHERE last_message_at >= NOW() - INTERVAL '24 hours'"
    );
    const activeSessionsLast24h = parseInt(activeSessions24hResult.rows[0].count, 10);

    // 5. Response rate: % of conversations where at least one agent reply exists
    const responseRateResult = await pool.query(`
      SELECT 
        COUNT(DISTINCT c.id) AS total_convos,
        COUNT(DISTINCT CASE WHEN m.sender_type = 'agent' THEN c.id END) AS replied_convos
      FROM conversations c
      LEFT JOIN messages m ON m.conversation_id = c.id
    `);
    const totalConvos = parseInt(responseRateResult.rows[0].total_convos, 10);
    const repliedConvos = parseInt(responseRateResult.rows[0].replied_convos, 10);
    const responseRate = totalConvos > 0 ? ((repliedConvos / totalConvos) * 100).toFixed(1) : '0.0';

    // 6. Per-platform message breakdown
    const perPlatformResult = await pool.query(`
      SELECT c.platform, COUNT(m.id) AS count
      FROM messages m
      JOIN conversations c ON c.id = m.conversation_id
      GROUP BY c.platform
      ORDER BY count DESC
    `);
    const perPlatform = {};
    perPlatformResult.rows.forEach((row) => {
      perPlatform[row.platform] = parseInt(row.count, 10);
    });

    // 7. Weekly analytics: current calendar week, always ordered Monday-Sunday.
    // Build date strings in PostgreSQL so timezone conversion cannot shift a day.
    const weeklyResult = await pool.query(`
      WITH week_days AS (
        SELECT generate_series(
          date_trunc('week', CURRENT_DATE)::date,
          date_trunc('week', CURRENT_DATE)::date + 6,
          INTERVAL '1 day'
        )::date AS day
      ),
      platforms(platform) AS (
        VALUES ('whatsapp'), ('instagram'), ('facebook'), ('tiktok')
      )
      SELECT
        TO_CHAR(wd.day, 'YYYY-MM-DD') AS day,
        p.platform,
        COUNT(m.id) AS count
      FROM week_days wd
      CROSS JOIN platforms p
      LEFT JOIN conversations c ON c.platform = p.platform
      LEFT JOIN messages m
        ON m.conversation_id = c.id
        AND m.created_at >= wd.day
        AND m.created_at < wd.day + INTERVAL '1 day'
      GROUP BY wd.day, p.platform
      ORDER BY wd.day ASC, p.platform ASC
    `);

    const weeklyAnalytics = {};
    weeklyResult.rows.forEach((row) => {
      if (!weeklyAnalytics[row.day]) {
        weeklyAnalytics[row.day] = { whatsapp: 0, instagram: 0, facebook: 0, tiktok: 0 };
      }
      weeklyAnalytics[row.day][row.platform] = parseInt(row.count, 10);
    });

    // 8. Latest messages preview (for latest queries widget)
    const latestResult = await pool.query(`
      SELECT 
        c.id AS conversation_id,
        cu.name AS customer_name,
        c.platform,
        c.last_message_at,
        (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message
      FROM conversations c
      JOIN customers cu ON cu.id = c.customer_id
      ORDER BY c.last_message_at DESC
      LIMIT 5
    `);

    res.json({
      totalMessages,
      totalConversations,
      messagesLast24h,
      activeSessionsLast24h,
      responseRate: parseFloat(responseRate),
      perPlatform,
      weeklyAnalytics,
      latestQueries: latestResult.rows,
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
}

module.exports = { getStats };

const express = require('express');
const cors = require('cors');
const webhookRoutes = require('./routes/webhookRoutes');
const messageRoutes = require('./routes/messageRoutes');
const statsRoutes = require('./routes/statsRoutes');

const app = express();

app.use(cors());

// Webhooks use route-specific parsers so Meta signatures can be checked against
// the exact request bytes before the body is accepted as JSON.
app.use('/webhooks', webhookRoutes);

app.use(express.json());

// Dashboard-facing REST API
app.use('/api', messageRoutes);
app.use('/api', statsRoutes);

app.get('/', (req, res) => {
  res.send('SocialSync Pro backend is running');
});

app.use((err, req, res, next) => {
  if (err?.code === 'META_SIGNATURE_INVALID') {
    console.warn('Meta webhook rejected due to invalid signature');
    return res.status(403).json({ error: 'Invalid webhook signature' });
  }

  if (err?.code === 'META_SIGNATURE_NOT_CONFIGURED') {
    console.error('Meta webhook signature verification is not configured');
    return res.status(503).json({ error: 'Webhook verification unavailable' });
  }

  if (err?.type === 'entity.parse.failed') {
    console.warn('Malformed JSON request rejected', { path: req.path });
    return res.status(400).json({ error: 'Malformed JSON payload' });
  }

  console.error('Unhandled request error', {
    path: req.path,
    error: err?.message || 'Unknown error',
  });
  return res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;

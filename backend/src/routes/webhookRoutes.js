const express = require('express');
const router = express.Router();
const {
  verifyMetaRequestSignature,
} = require('../integrations/providers/meta/metaSignature');
const {
  verifyMetaWebhook,
  handleMetaWebhook,
} = require('../controllers/webhookController');

// Facebook + Instagram share one webhook endpoint (Meta convention)
router.get('/meta', verifyMetaWebhook);
router.post(
  '/meta',
  express.json({
    limit: '1mb',
    verify: verifyMetaRequestSignature,
  }),
  handleMetaWebhook
);

module.exports = router;

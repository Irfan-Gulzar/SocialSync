const {
  parseMetaWebhook,
} = require('../integrations/providers/meta/metaEventParser');
const { processInboundMessage } = require('../services/inboundMessageService');

function getMetaVerifyToken() {
  return process.env.WEBHOOK_VERIFY_TOKEN || process.env.META_VERIFY_TOKEN;
}

// Meta (Facebook/Instagram) webhook verification handshake (GET request)
function verifyMetaWebhook(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const expectedToken = getMetaVerifyToken();
  if (expectedToken && mode === 'subscribe' && token === expectedToken) {
    console.info('Meta webhook verification succeeded');
    return res.status(200).send(challenge);
  }

  console.warn('Meta webhook verification failed');
  return res.sendStatus(403);
}

function createMetaWebhookHandler(dependencies = {}) {
  const parse = dependencies.parseMetaWebhook || parseMetaWebhook;
  const processMessage =
    dependencies.processInboundMessage || processInboundMessage;

  return async function handleMetaWebhook(req, res) {
    const entryCount = Array.isArray(req.body?.entry) ? req.body.entry.length : 0;
    console.info('Meta webhook received', {
      object: req.body?.object || 'unknown',
      entryCount,
    });

    const events = parse(req.body);
    let processingFailed = false;

    for (const event of events) {
      if (!event.processable) {
        console.info('Meta webhook event acknowledged without persistence', {
          platform: event.platform,
          eventType: event.eventType,
          reason: event.reason,
        });
        continue;
      }

      try {
        const result = await processMessage(event);
        if (result.status === 'duplicate') {
          console.info('Duplicate Meta message ignored', {
            platform: event.platform,
            eventType: event.eventType,
            conversationId: result.conversationId,
          });
        } else {
          console.info('Meta message processed', {
            platform: event.platform,
            eventType: event.eventType,
            conversationId: result.conversationId,
            messageId: result.messageId,
          });
        }
      } catch (error) {
        processingFailed = true;
        console.error('Meta webhook event processing failed', {
          platform: event.platform,
          eventType: event.eventType,
          error: error.message,
        });
      }
    }

    return res.sendStatus(processingFailed ? 500 : 200);
  };
}

const handleMetaWebhook = createMetaWebhookHandler();

module.exports = {
  verifyMetaWebhook,
  handleMetaWebhook,
  createMetaWebhookHandler,
};

const crypto = require('crypto');

class MetaWebhookError extends Error {
  constructor(message, code, status) {
    super(message);
    this.name = 'MetaWebhookError';
    this.code = code;
    this.status = status;
  }
}

function createMetaSignature(rawBody, appSecret) {
  return `sha256=${crypto
    .createHmac('sha256', appSecret)
    .update(rawBody)
    .digest('hex')}`;
}

function getWebhookObject(rawBody) {
  try {
    const body = JSON.parse(rawBody.toString('utf8'));
    return typeof body?.object === 'string' ? body.object.toLowerCase() : null;
  } catch {
    return null;
  }
}

function getSigningSecrets(rawBody) {
  const webhookObject = getWebhookObject(rawBody);
  const metaAppSecret = process.env.META_APP_SECRET;
  const instagramAppSecret = process.env.IG_APP_SECRET;

  if (webhookObject === 'instagram') {
    return instagramAppSecret ? [instagramAppSecret] : [metaAppSecret].filter(Boolean);
  }

  if (webhookObject === 'page') {
    return [metaAppSecret].filter(Boolean);
  }

  // A malformed or unfamiliar body still has to prove that it came from one
  // of the configured Meta applications before JSON parsing/error handling.
  return [...new Set([metaAppSecret, instagramAppSecret].filter(Boolean))];
}

function verifyMetaRequestSignature(req, res, rawBody) {
  const signingSecrets = getSigningSecrets(rawBody);
  if (signingSecrets.length === 0) {
    throw new MetaWebhookError(
      'Meta webhook signature verification is not configured',
      'META_SIGNATURE_NOT_CONFIGURED',
      503
    );
  }

  const signature = req.get('x-hub-signature-256');
  if (!signature || !/^sha256=[0-9a-f]{64}$/i.test(signature)) {
    throw new MetaWebhookError(
      'Meta webhook signature is missing or malformed',
      'META_SIGNATURE_INVALID',
      403
    );
  }

  const received = Buffer.from(signature.slice('sha256='.length), 'hex');
  const isValid = signingSecrets.some((appSecret) => {
    const expected = crypto
      .createHmac('sha256', appSecret)
      .update(rawBody)
      .digest();
    return (
      expected.length === received.length &&
      crypto.timingSafeEqual(expected, received)
    );
  });

  if (!isValid) {
    throw new MetaWebhookError(
      'Meta webhook signature is invalid',
      'META_SIGNATURE_INVALID',
      403
    );
  }
}

module.exports = {
  MetaWebhookError,
  createMetaSignature,
  getSigningSecrets,
  verifyMetaRequestSignature,
};

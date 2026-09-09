const crypto = require('crypto');

const OBJECT_PLATFORMS = {
  page: 'facebook',
  instagram: 'instagram',
};

function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function eventTimestamp(messagingEvent, entry) {
  const value = Number(messagingEvent?.timestamp ?? entry?.time);
  if (!Number.isFinite(value)) return null;

  const timestamp = new Date(value);
  return Number.isNaN(timestamp.getTime()) ? null : timestamp;
}

function normalizeAttachments(attachments) {
  if (!Array.isArray(attachments)) return [];

  return attachments.map((attachment) => {
    const normalized = {
      type: attachment?.type || 'unknown',
    };

    if (typeof attachment?.payload?.url === 'string') {
      normalized.url = attachment.payload.url;
    }
    if (typeof attachment?.title === 'string') {
      normalized.title = attachment.title;
    }
    if (attachment?.payload?.sticker_id != null) {
      normalized.stickerId = String(attachment.payload.sticker_id);
    }

    return normalized;
  });
}

function attachmentPlaceholder(attachments) {
  if (attachments.length === 0) return '';
  const type = String(attachments[0].type || 'media');
  return `[${type.charAt(0).toUpperCase()}${type.slice(1)} attachment]`;
}

function ignoredEvent(platform, eventType, reason, accountExternalId = null) {
  return {
    platform,
    eventType,
    processable: false,
    reason,
    accountExternalId,
  };
}

function classifyNonMessageEvent(platform, messagingEvent, accountExternalId) {
  if (messagingEvent?.delivery) {
    return ignoredEvent(platform, 'delivery', 'status_event', accountExternalId);
  }
  if (messagingEvent?.read) {
    return ignoredEvent(platform, 'read', 'status_event', accountExternalId);
  }
  if (messagingEvent?.reaction) {
    return ignoredEvent(platform, 'reaction', 'status_event', accountExternalId);
  }
  if (messagingEvent?.referral) {
    return ignoredEvent(platform, 'referral', 'unsupported_event', accountExternalId);
  }

  return ignoredEvent(platform, 'unknown', 'unsupported_event', accountExternalId);
}

function normalizeMessageEvent(platform, entry, messagingEvent) {
  const accountExternalId = String(entry.id);
  const message = messagingEvent.message;

  if (message.is_echo || message.is_self || messagingEvent.is_self) {
    return ignoredEvent(platform, 'echo', 'outbound_echo', accountExternalId);
  }
  if (message.is_deleted) {
    return ignoredEvent(platform, 'deleted', 'deleted_message', accountExternalId);
  }
  if (message.is_unsupported) {
    return ignoredEvent(platform, 'unsupported', 'unsupported_message', accountExternalId);
  }

  const customerExternalId = messagingEvent?.sender?.id;
  const recipientExternalId = messagingEvent?.recipient?.id;
  const externalMessageId = message.mid;
  const timestamp = eventTimestamp(messagingEvent, entry);

  if (!customerExternalId || !recipientExternalId || !externalMessageId || !timestamp) {
    return ignoredEvent(platform, 'message', 'malformed_event', accountExternalId);
  }

  const attachments = normalizeAttachments(message.attachments);
  const suppliedText = typeof message.text === 'string' ? message.text : '';
  const text = suppliedText || attachmentPlaceholder(attachments);
  if (!text) {
    return ignoredEvent(platform, 'message', 'empty_message', accountExternalId);
  }

  let messageType = 'text';
  if (attachments.length > 0 && suppliedText) messageType = 'mixed';
  else if (attachments.length > 0) messageType = attachments[0].type || 'attachment';

  return {
    platform,
    eventType: 'message',
    processable: true,
    accountExternalId,
    customerExternalId: String(customerExternalId),
    recipientExternalId: String(recipientExternalId),
    externalMessageId: String(externalMessageId),
    deduplicationKey: `meta:${platform}:${accountExternalId}:${externalMessageId}`,
    direction: 'inbound',
    customerName: null,
    text,
    messageType,
    attachments,
    replyToExternalMessageId: message?.reply_to?.mid
      ? String(message.reply_to.mid)
      : null,
    timestamp,
  };
}

function normalizePostbackEvent(platform, entry, messagingEvent) {
  const accountExternalId = String(entry.id);
  if (messagingEvent.is_self || messagingEvent?.postback?.is_self) {
    return ignoredEvent(platform, 'postback', 'self_postback', accountExternalId);
  }

  const customerExternalId = messagingEvent?.sender?.id;
  const recipientExternalId = messagingEvent?.recipient?.id;
  const timestamp = eventTimestamp(messagingEvent, entry);
  const title = messagingEvent?.postback?.title;
  const payload = messagingEvent?.postback?.payload;

  if (!customerExternalId || !recipientExternalId || !timestamp) {
    return ignoredEvent(platform, 'postback', 'malformed_event', accountExternalId);
  }

  const stableEvent = [
    platform,
    accountExternalId,
    customerExternalId,
    recipientExternalId,
    timestamp.getTime(),
    title || '',
    payload || '',
  ].join('|');

  return {
    platform,
    eventType: 'postback',
    processable: true,
    accountExternalId,
    customerExternalId: String(customerExternalId),
    recipientExternalId: String(recipientExternalId),
    externalMessageId: null,
    deduplicationKey: `meta:${platform}:${accountExternalId}:postback:${hash(stableEvent)}`,
    direction: 'inbound',
    customerName: null,
    text: title || (payload ? `[Postback: ${payload}]` : '[Postback]'),
    messageType: 'postback',
    attachments: [],
    replyToExternalMessageId: null,
    timestamp,
  };
}

function configuredAccountId(platform, accountIds) {
  if (accountIds && Object.prototype.hasOwnProperty.call(accountIds, platform)) {
    return accountIds[platform];
  }

  return platform === 'facebook' ? process.env.FB_PAGE_ID : process.env.IG_PAGE_ID;
}

function parseMetaWebhook(body, accountIds) {
  const platform = OBJECT_PLATFORMS[body?.object];
  if (!platform || !Array.isArray(body?.entry)) {
    return [ignoredEvent(platform || null, 'unknown', 'malformed_payload')];
  }

  const events = [];
  const expectedAccountId = configuredAccountId(platform, accountIds);

  for (const entry of body.entry) {
    if (!entry?.id || !Array.isArray(entry.messaging)) {
      events.push(ignoredEvent(platform, 'unknown', 'malformed_entry', entry?.id || null));
      continue;
    }

    if (expectedAccountId && String(entry.id) !== String(expectedAccountId)) {
      events.push(ignoredEvent(platform, 'unknown', 'account_mismatch', String(entry.id)));
      continue;
    }

    for (const messagingEvent of entry.messaging) {
      if (!messagingEvent || typeof messagingEvent !== 'object') {
        events.push(ignoredEvent(platform, 'unknown', 'malformed_event', String(entry.id)));
      } else if (messagingEvent.message) {
        events.push(normalizeMessageEvent(platform, entry, messagingEvent));
      } else if (messagingEvent.postback) {
        events.push(normalizePostbackEvent(platform, entry, messagingEvent));
      } else {
        events.push(classifyNonMessageEvent(platform, messagingEvent, String(entry.id)));
      }
    }
  }

  return events;
}

module.exports = {
  parseMetaWebhook,
  normalizeAttachments,
};

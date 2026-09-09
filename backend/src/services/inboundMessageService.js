const pool = require('../config/db');
const Customer = require('../models/Customer');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { emitNewMessage } = require('../sockets/socket');

async function processInboundMessage(normalized, dependencies = {}) {
  const db = dependencies.pool || pool;
  const customerRepository = dependencies.Customer || Customer;
  const conversationRepository = dependencies.Conversation || Conversation;
  const messageRepository = dependencies.Message || Message;
  const emit = dependencies.emitNewMessage || emitNewMessage;
  const client = await db.connect();

  let customer;
  let conversation;
  let message;

  try {
    await client.query('BEGIN');

    customer = await customerRepository.findOrCreate(
      normalized.platform,
      normalized.customerExternalId,
      normalized.customerName,
      client
    );

    conversation = await conversationRepository.findOrCreate(
      customer.id,
      normalized.platform,
      client,
      normalized.timestamp
    );

    message = await messageRepository.createInbound(
      {
        conversationId: conversation.id,
        content: normalized.text,
        platformMessageId: normalized.externalMessageId,
        deduplicationKey: normalized.deduplicationKey,
        messageType: normalized.messageType,
        attachments: normalized.attachments,
        replyToPlatformMessageId: normalized.replyToExternalMessageId,
        timestamp: normalized.timestamp,
      },
      client
    );

    if (message) {
      await conversationRepository.touch(
        conversation.id,
        normalized.timestamp,
        client
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Inbound message transaction rollback failed', {
        error: rollbackError.message,
      });
    }
    throw error;
  } finally {
    client.release();
  }

  if (!message) {
    return {
      status: 'duplicate',
      conversationId: conversation.id,
    };
  }

  try {
    emit({
      conversationId: conversation.id,
      messageId: message.id,
      platform: normalized.platform,
      customerName: customer.name,
      text: message.content,
      messageType: message.message_type,
      attachments: message.attachments,
      createdAt: message.created_at,
    });
  } catch (error) {
    console.error('Realtime notification failed after message persistence', {
      platform: normalized.platform,
      conversationId: conversation.id,
      error: error.message,
    });
  }

  return {
    status: 'processed',
    conversationId: conversation.id,
    messageId: message.id,
  };
}

module.exports = { processInboundMessage };

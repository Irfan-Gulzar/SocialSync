const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const facebookService = require('../services/facebookService');
const instagramService = require('../services/instagramService');

const platformSenders = {
  facebook: facebookService,
  instagram: instagramService,
};

// GET /api/conversations - list all conversations for the dashboard inbox
async function getConversations(req, res) {
  const conversations = await Conversation.listAll();
  res.json(conversations);
}

// GET /api/conversations/:id/messages - get full message thread
async function getMessages(req, res) {
  const { id } = req.params;
  const messages = await Message.findByConversation(id);
  res.json(messages);
}

// POST /api/conversations/:id/reply - agent sends a reply from the dashboard
async function sendReply(req, res) {
  const { id } = req.params;
  const { text } = req.body;

  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Message text is required' });
  }

  // Fetch conversation + customer to know which platform/recipient to send to
  const convResult = await Conversation.listAll();
  const targetConversation = convResult.find((c) => c.id === Number(id));

  if (!targetConversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const sender = platformSenders[targetConversation.platform];
  if (!sender) {
    return res.status(400).json({ error: 'Unsupported platform' });
  }

  let providerResponse;
  try {
    providerResponse = await sender.sendMessage(
      targetConversation.platform_customer_id,
      text
    );
  } catch (error) {
    console.error('Outbound message failed', {
      platform: targetConversation.platform,
      httpStatus: error.response?.status || null,
      providerCode: error.response?.data?.error?.code || null,
      errorCode: error.code || null,
    });
    return res.status(502).json({
      error: `Failed to send ${targetConversation.platform} reply`,
    });
  }

  const platformMessageId =
    providerResponse?.message_id || providerResponse?.messages?.[0]?.id || null;
  const message = await Message.create(
    id,
    'agent',
    text.trim(),
    platformMessageId
  );
  await Conversation.touch(id);

  res.status(201).json(message);
}

module.exports = { getConversations, getMessages, sendReply };

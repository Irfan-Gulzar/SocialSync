const axios = require('axios');

const DEFAULT_GRAPH_API_VERSION = 'v26.0';
const GRAPH_API_ORIGIN = 'https://graph.instagram.com';

function configurationError(message) {
  const error = new Error(message);
  error.code = 'INSTAGRAM_CONFIGURATION_ERROR';
  return error;
}

function createInstagramService(options = {}) {
  const httpClient = options.httpClient || axios;
  const env = options.env || process.env;

  async function sendMessage(recipientId, text) {
    const accessToken = env.IG_PAGE_ACCESS_TOKEN;
    const apiVersion = env.IG_GRAPH_API_VERSION || DEFAULT_GRAPH_API_VERSION;

    if (!accessToken) {
      throw configurationError('IG_PAGE_ACCESS_TOKEN is not configured');
    }
    if (!/^v\d+\.\d+$/.test(apiVersion)) {
      throw configurationError('IG_GRAPH_API_VERSION has an invalid format');
    }
    if (!recipientId || typeof text !== 'string' || !text.trim()) {
      const error = new Error('Instagram recipient and message text are required');
      error.code = 'INSTAGRAM_MESSAGE_INVALID';
      throw error;
    }

    const response = await httpClient.post(
      `${GRAPH_API_ORIGIN}/${apiVersion}/me/messages`,
      {
        recipient: { id: String(recipientId) },
        message: { text: text.trim() },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    return response.data;
  }

  return { sendMessage };
}

module.exports = {
  ...createInstagramService(),
  createInstagramService,
};

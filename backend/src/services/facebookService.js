const axios = require('axios');

const DEFAULT_GRAPH_API_VERSION = 'v26.0';
const GRAPH_API_ORIGIN = 'https://graph.facebook.com';

function configurationError(message) {
  const error = new Error(message);
  error.code = 'FACEBOOK_CONFIGURATION_ERROR';
  return error;
}

function createFacebookService(options = {}) {
  const httpClient = options.httpClient || axios;
  const env = options.env || process.env;

  async function sendMessage(recipientId, text) {
    const pageId = env.FB_PAGE_ID;
    const accessToken = env.FB_PAGE_ACCESS_TOKEN;
    const apiVersion = env.FB_GRAPH_API_VERSION || DEFAULT_GRAPH_API_VERSION;

    if (!pageId || !accessToken) {
      throw configurationError(
        'FB_PAGE_ID and FB_PAGE_ACCESS_TOKEN must be configured'
      );
    }
    if (!/^v\d+\.\d+$/.test(apiVersion)) {
      throw configurationError('FB_GRAPH_API_VERSION has an invalid format');
    }
    if (!recipientId || typeof text !== 'string' || !text.trim()) {
      const error = new Error('Facebook recipient and message text are required');
      error.code = 'FACEBOOK_MESSAGE_INVALID';
      throw error;
    }

    const response = await httpClient.post(
      `${GRAPH_API_ORIGIN}/${apiVersion}/${encodeURIComponent(pageId)}/messages`,
      {
        recipient: { id: String(recipientId) },
        messaging_type: 'RESPONSE',
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
  ...createFacebookService(),
  createFacebookService,
};

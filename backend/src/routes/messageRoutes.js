const express = require('express');
const router = express.Router();
const {
  getConversations,
  getMessages,
  sendReply,
} = require('../controllers/messageController');

router.get('/conversations', getConversations);
router.get('/conversations/:id/messages', getMessages);
router.post('/conversations/:id/reply', sendReply);

module.exports = router;

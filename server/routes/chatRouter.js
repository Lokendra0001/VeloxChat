const { handleSendMsg, handleGetAllChats } = require('../controllers/chat');
const { Router } = require('express');
const router = Router();

router.post('/send-message', handleSendMsg);

router.get('/getAllChats', handleGetAllChats)
module.exports = router;
const { handleCreateMsg, handleGetAllChats } = require('../controllers/chat');
const { Router } = require('express');
const router = Router();
const upload = require('../config/cloudinary');

router.post('/createMsg', upload.single("selectedFile"), handleCreateMsg);

router.get('/getAllChats', handleGetAllChats);

router.post
module.exports = router;
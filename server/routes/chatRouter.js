const Chats = require('../models/chat-model');
const { Router } = require('express');
const router = Router();

router.post('/send-message', async (req, res) => {
    try {
        const { message, sender_id, receiver_id } = req.body;
        const msgCreated = await Chats.create({ message, sender_id, receiver_id });
        res.status(201).json({ message: "Message Sent", msg: msgCreated })
    } catch (error) {
        res.status(500).json(error.message)
    }
});

router.get('/getAllChats', async (req, res) => {
    try {
        const chats = await Chats.find({})
        res.status(200).json(chats)
    } catch (error) {
        res.status(500).json(error.message)

    }
})
module.exports = router;
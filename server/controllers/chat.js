const Chats = require('../models/chat-model');

const handleSendMsg = async (req, res) => {
    try {
        const { message, sender_id, receiver_id } = req.body;
        const msgCreated = await Chats.create({ message, sender_id, receiver_id });
        res.status(201).json({ message: "Message Sent", msg: msgCreated })
    } catch (error) {
        res.status(500).json(error.message)
    }
};

const handleGetAllChats = async (req, res) => {
    try {
        const chats = await Chats.find({})
        res.status(200).json(chats)
    } catch (error) {
        res.status(500).json(error.message)

    }
}

module.exports = {
    handleSendMsg,
    handleGetAllChats
}
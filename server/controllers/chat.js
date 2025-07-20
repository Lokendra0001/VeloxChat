const Chats = require('../models/chat-model');

const handleCreateMsg = async (req, res) => {
    try {
        const { sender_id, receiver_id, group_id, text } = req.body;
        const msgPayload = {
            text: text || null,
            fileUrl: req.file ? `${req.file.path}` : null,
            fileType: req.file?.mimetype || null,
        };
        const chat = await Chats.create({ message: msgPayload, sender_id, receiver_id, group_id });
        res.status(201).json({ message: "Message Sent", chat })
    } catch (error) {
        res.status(500).json(error)
    }
};

const handleGetAllChats = async (req, res) => {
    try {
        const chats = await Chats.find({})
            .populate({
                path: 'sender_id',
                select: '_id  username profilePic status' // exclude password
            });

        res.status(200).json(chats)
    } catch (error) {
        res.status(500).json(error)

    }
}

module.exports = {
    handleCreateMsg,
    handleGetAllChats
}
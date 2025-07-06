const { Schema, model } = require('mongoose')

const chatSchema = new Schema({
    message: {
        type: String,
        required: true,
    },
    sender_id: {
        type: String,
        required: true
    },
    receiver_id: {
        type: String,
        required: true
    }
}, { timestamps: true })

const Chats = model('chat', chatSchema)

module.exports = Chats;
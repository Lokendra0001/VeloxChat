const { Schema, model, default: mongoose } = require('mongoose');

const chatSchema = new Schema({
    message: {
        text: {
            type: String,
            default: null
        },
        fileUrl: {
            type: String,
            default: null
        },
        fileType: {
            type: String,
            default: null
        }
    },
    sender_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    receiver_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        default: null,
    },
    group_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'groups',
        default: null,
    },
}, { timestamps: true });

const Chats = model('chat', chatSchema);
module.exports = Chats;

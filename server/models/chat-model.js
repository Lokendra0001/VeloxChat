const { Schema, model, default: mongoose } = require('mongoose');

const chatSchema = new Schema({
    message: {
        type: String,
        required: true,
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

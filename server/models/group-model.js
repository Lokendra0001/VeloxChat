const { Schema, model, default: mongoose } = require('mongoose');

const groupSchema = new Schema({
    groupName: {
        type: String,
        required: true,
        trim: true,
    },
    groupProfileImg: {
        type: String,
        default: '', // Optional: fallback image
    },
    groupMember: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            required: true,
        },
    ],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
}, { timestamps: true });

const Group = model('groups', groupSchema);

module.exports = Group;

const { Schema, model, default: mongoose } = require('mongoose');

const contactRequestSchema = new Schema({
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    status: {
        type: String,
        enum: ["accepted", "rejected", "pending"],
        default: "pending"
    }
}, { timestamps: true })

const contactRequest = model('contactRequest', contactRequestSchema)

module.exports = contactRequest;
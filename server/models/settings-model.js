const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    features: {
        themeToggle: {
            type: Boolean,
            default: true
        },
        videoCall: {
            type: Boolean,
            default: true
        },
        aiChat: {
            type: Boolean,
            default: true
        }
    }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);

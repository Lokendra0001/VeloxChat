const mongoose = require('mongoose');

async function mongoConnection(URI) {
    try {
        await mongoose.connect(URI);
        return "MongoDB Connected Successfully!";
    } catch (error) {
        return error.message;
    }
}

module.exports = mongoConnection;

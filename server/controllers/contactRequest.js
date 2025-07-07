const contactRequest = require('../models/contactRequest-model');


const handleGetAllRequests = async (req, res) => {
    try {
        const requests = await contactRequest.find({});
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json(error.message)

    }
}

const handleSendRequest = async (req, res) => {
    try {
        const { from, to } = req.body;
        await contactRequest.create({ from, to });
        res.json({ message: "Request Sent Successfully!" })

    } catch (error) {
        res.status(500).json(error.message)
    }
}

const handleAcceptRequest = async (req, res) => {
    try {
        const request_id = req.params.id;
        await contactRequest.updateOne({ _id: request_id }, { status: "accepted" });
        res.status(200).json({ message: "Request Accepted." })
    } catch (error) {
        res.status(500).json(error.message)
    }
}

const handleRejectRequest = async (req, res) => {
    try {
        const request_id = req.params.id;
        await contactRequest.deleteOne({ _id: request_id });
        res.status(200).json({ message: "Request Rejected." })
    } catch (error) {
        res.status(500).json(error.message)
    }
}

const handleGetAllLoggedInUserRequests = async (req, res) => {
    try {
        const userId = req.params.userId;
        const requests = await contactRequest.find({ to: userId, status: "pending" }).populate('from');
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json(error.message)

    }
}

module.exports = {
    handleGetAllRequests,
    handleSendRequest,
    handleAcceptRequest,
    handleRejectRequest,
    handleGetAllLoggedInUserRequests
}
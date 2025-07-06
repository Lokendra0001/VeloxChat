const { Router } = require('express');
const router = Router();
const contactRequest = require('../models/contactRequest-model');


router.get("/requests", async (req, res) => {
    try {
        const requests = await contactRequest.find({});
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json(error.message)

    }
})


router.post("/send", async (req, res) => {
    try {
        const { from, to } = req.body;
        await contactRequest.create({ from, to });
        res.json({ message: "Request Sent Successfully!" })

    } catch (error) {
        res.status(500).json(error.message)
    }
})

router.patch('/accept/:id', async (req, res) => {
    try {
        const request_id = req.params.id;
        await contactRequest.updateOne({ _id: request_id }, { status: "accepted" });
        res.status(200).json({ message: "Request Accepted." })
    } catch (error) {
        res.status(500).json(error.message)
    }
})

router.patch('/reject/:id', async (req, res) => {
    try {
        const request_id = req.params.id;
        await contactRequest.deleteOne({ _id: request_id });
        res.status(200).json({ message: "Request Rejected." })
    } catch (error) {
        res.status(500).json(error.message)
    }
})

router.get("/requests/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
        const requests = await contactRequest.find({ to: userId, status: "pending" }).populate('from');
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json(error.message)

    }
})

module.exports = router;
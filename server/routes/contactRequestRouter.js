const { Router } = require('express');
const router = Router();
const { handleGetAllRequests, handleSendRequest, handleAcceptRequest, handleRejectRequest, handleGetAllLoggedInUserRequests } = require('../controllers/contactRequest');


router.get("/requests", handleGetAllRequests)

router.post("/send", handleSendRequest)

router.patch('/accept/:id', handleAcceptRequest)

router.patch('/reject/:id', handleRejectRequest)

router.get("/requests/:userId", handleGetAllLoggedInUserRequests)

module.exports = router;
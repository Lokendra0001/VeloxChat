const { Router } = require('express');
const checkAuthentication = require('../middleware/auth');
const checkAdmin = require('../middleware/role');
const Users = require('../models/user-model');
const Chats = require('../models/chat-model');

const router = Router();

// Get admin stats (messages and users)
router.get('/stats', checkAuthentication, checkAdmin, async (req, res) => {
  try {
    const totalUsers = await Users.countDocuments();
    const totalMessages = await Chats.countDocuments();

    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);

    // Messages per month (Current year)
    const messageStats = await Chats.aggregate([
      { $match: { createdAt: { $gte: startOfYear } } },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Users per month (Current year)
    const userStats = await Users.aggregate([
      { $match: { createdAt: { $gte: startOfYear } } },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      totalUsers,
      totalMessages,
      messageStats,
      userStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all users (admin only)
router.get('/users', checkAuthentication, checkAdmin, async (req, res) => {
  try {
    const users = await Users.find({});
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user role (admin only)
router.patch('/users/:id/role', checkAuthentication, checkAdmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body; // expected 'admin' or 'user'
  if (!['admin', 'user'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role value' });
  }
  try {
    const user = await Users.findByIdAndUpdate(id, { role }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a user (admin only)
router.delete('/users/:id', checkAuthentication, checkAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const user = await Users.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

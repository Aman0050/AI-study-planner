const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Task = require('../models/Task');
const { adminAuth } = require('../middleware/adminAuth');

// @route   GET /api/admin/stats
// @desc    Get dashboard metrics for admin
router.get('/stats', adminAuth, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalTasks = await Task.countDocuments();
        const completedTasks = await Task.countDocuments({ completed: true });

        // Get tasks created in last 7 days
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const newUsers = await User.countDocuments({ createdAt: { $gte: oneWeekAgo } });

        res.json({
            totalUsers,
            totalTasks,
            completedTasks,
            newUsers
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   GET /api/admin/users
// @desc    Get all users with basic task counts
router.get('/users', adminAuth, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort('-createdAt');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user
router.delete('/users/:id', adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.isAdmin) return res.status(400).json({ message: 'Cannot delete other admins' });

        await user.deleteOne();
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   PATCH /api/admin/users/:id/role
// @desc    Toggle admin role
router.patch('/users/:id/role', adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.isAdmin = !user.isAdmin;
        await user.save();
        res.json({ message: 'Role updated', user: { id: user._id, isAdmin: user.isAdmin } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;

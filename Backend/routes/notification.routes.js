const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth.middleware');
const Notification = require('../models/Notification');

// GET all notifications for logged-in user
router.get('/api/notifications', authenticate, async (req, res, next) => {
    try {
        const notifications = await Notification.find({
            recipientId:   req.user.id,
            recipientRole: req.user.role
        })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

        const unreadCount = notifications.filter(n => !n.isRead).length;
        res.json({ success: true, notifications, unreadCount });
    } catch (err) {
        next(err);
    }
});

// PATCH mark single notification as read
router.patch('/api/notifications/:id/read', authenticate, async (req, res, next) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

// PATCH mark all as read
router.patch('/api/notifications/read-all', authenticate, async (req, res, next) => {
    try {
        await Notification.updateMany(
            { recipientId: req.user.id, recipientRole: req.user.role, isRead: false },
            { isRead: true }
        );
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
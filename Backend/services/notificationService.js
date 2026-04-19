const Notification = require('../models/Notification');

async function sendNotification(io, { recipientId, recipientRole, type, message, link }) {
    const notification = await Notification.create({
        recipientId,
        recipientRole,
        type,
        message,
        link
    });

    const room = `user_${recipientRole}_${recipientId}`;
    io.to(room).emit('new_notification', {
        _id:       notification._id,
        message,
        link,
        type,
        isRead:    false,
        createdAt: notification.createdAt
    });

    return notification;
}

module.exports = { sendNotification };
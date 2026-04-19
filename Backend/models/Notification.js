const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipientId:   { type: Number, required: true },
    recipientRole: { type: String, enum: ['Donor', 'NGO', 'Carehome'], required: true },
    type:          { type: String, required: true },
    message:       { type: String, required: true },
    link:          { type: String, required: true },
    isRead:        { type: Boolean, default: false },
    createdAt:     { type: Date, default: Date.now }
});

notificationSchema.index({ recipientId: 1, recipientRole: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
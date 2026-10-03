const notificationModel = require('../models/notificationModel');
const { AppError } = require('../middleware/errorHandler');

async function listNotifications(req, res, next) {
  try {
    const { unreadOnly, page = 1, limit = 20 } = req.query;
    const result = await notificationModel.findAllByUser(req.user.id, {
      unreadOnly: unreadOnly === 'true',
      page,
      limit,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function markRead(req, res, next) {
  try {
    const notification = await notificationModel.markAsRead(req.params.id, req.user.id);
    if (!notification) throw new AppError('Notification not found', 404);
    res.json({ success: true, notification });
  } catch (err) {
    next(err);
  }
}

async function markAllRead(req, res, next) {
  try {
    const count = await notificationModel.markAllAsRead(req.user.id);
    res.json({ success: true, message: `${count} notifications marked as read` });
  } catch (err) {
    next(err);
  }
}

async function deleteNotification(req, res, next) {
  try {
    const deleted = await notificationModel.deleteById(req.params.id, req.user.id);
    if (!deleted) throw new AppError('Notification not found', 404);
    res.json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listNotifications, markRead, markAllRead, deleteNotification };

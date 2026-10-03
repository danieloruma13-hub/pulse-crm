const messageModel = require('../models/messageModel');
const { AppError } = require('../middleware/errorHandler');

async function createMessage(req, res, next) {
  try {
    const { contactId, direction, channel, subject, body, status } = req.body;
    if (!body) throw new AppError('Message body is required', 400);

    const message = await messageModel.create({
      userId: req.user.id,
      contactId,
      direction,
      channel,
      subject,
      body,
      status,
    });
    res.status(201).json({ success: true, message });
  } catch (err) {
    next(err);
  }
}

async function listMessages(req, res, next) {
  try {
    const { contactId, channel, page = 1, limit = 20 } = req.query;
    const result = await messageModel.findAllByUser(req.user.id, { contactId, channel, page, limit });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function getMessage(req, res, next) {
  try {
    const message = await messageModel.findById(req.params.id);
    if (!message || message.userId !== req.user.id) throw new AppError('Message not found', 404);
    res.json({ success: true, message });
  } catch (err) {
    next(err);
  }
}

async function deleteMessage(req, res, next) {
  try {
    const deleted = await messageModel.deleteById(req.params.id, req.user.id);
    if (!deleted) throw new AppError('Message not found', 404);
    res.json({ success: true, message: 'Message deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { createMessage, listMessages, getMessage, deleteMessage };

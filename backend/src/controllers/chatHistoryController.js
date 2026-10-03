const chatMessageModel = require('../models/chatMessageModel');

async function getHistory(req, res, next) {
  try {
    const messages = await chatMessageModel.findAllByUser(req.user.id, { limit: 100 });
    res.json({ success: true, messages });
  } catch (err) { next(err); }
}

async function clearHistory(req, res, next) {
  try {
    const count = await chatMessageModel.deleteAllByUser(req.user.id);
    res.json({ success: true, message: `Cleared ${count} messages` });
  } catch (err) { next(err); }
}

module.exports = { getHistory, clearHistory };

const automationModel = require('../models/automationModel');
const { AppError } = require('../middleware/errorHandler');

async function createAutomation(req, res, next) {
  try {
    const { name, triggerType, triggerStage, actionType, actionConfig } = req.body;
    if (!name || !triggerType || !triggerStage || !actionType) {
      throw new AppError('name, triggerType, triggerStage, and actionType are required', 400);
    }
    if (!automationModel.TRIGGER_TYPES.includes(triggerType)) {
      throw new AppError(`Invalid triggerType. Must be one of: ${automationModel.TRIGGER_TYPES.join(', ')}`, 400);
    }
    if (!automationModel.ACTION_TYPES.includes(actionType)) {
      throw new AppError(`Invalid actionType. Must be one of: ${automationModel.ACTION_TYPES.join(', ')}`, 400);
    }
    const automation = await automationModel.create({ userId: req.user.id, name, triggerType, triggerStage, actionType, actionConfig });
    res.status(201).json({ success: true, automation });
  } catch (err) { next(err); }
}

async function listAutomations(req, res, next) {
  try {
    const automations = await automationModel.findAllByUser(req.user.id);
    res.json({ success: true, automations });
  } catch (err) { next(err); }
}

async function updateAutomation(req, res, next) {
  try {
    const { name, triggerType, triggerStage, actionType, actionConfig, enabled } = req.body;
    const updates = { name, triggerType, triggerStage, actionType, actionConfig, enabled };
    Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);

    const automation = await automationModel.updateById(req.params.id, req.user.id, updates);
    if (!automation) throw new AppError('Automation not found', 404);
    res.json({ success: true, automation });
  } catch (err) { next(err); }
}

async function deleteAutomation(req, res, next) {
  try {
    const deleted = await automationModel.deleteById(req.params.id, req.user.id);
    if (!deleted) throw new AppError('Automation not found', 404);
    res.json({ success: true, message: 'Automation deleted' });
  } catch (err) { next(err); }
}

module.exports = { createAutomation, listAutomations, updateAutomation, deleteAutomation };

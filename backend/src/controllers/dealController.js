const dealModel = require('../models/dealModel');
const { runAutomations } = require('../utils/automationEngine');
const { AppError } = require('../middleware/errorHandler');

function validateStage(stage) {
  if (stage && !dealModel.VALID_STAGES.includes(stage)) {
    throw new AppError(`Invalid stage. Must be one of: ${dealModel.VALID_STAGES.join(', ')}`, 400);
  }
}

async function createDeal(req, res, next) {
  try {
    const { title, contactId, leadId, value, currency, stage, probability, closeDate, notes } = req.body;
    if (!title) throw new AppError('Title is required', 400);
    validateStage(stage);

    const deal = await dealModel.create({
      userId: req.user.id,
      title,
      contactId,
      leadId,
      value,
      currency,
      stage,
      probability,
      closeDate,
      notes,
    });
    res.status(201).json({ success: true, deal });
  } catch (err) {
    next(err);
  }
}

async function listDeals(req, res, next) {
  try {
    const { search = '', stage, page = 1, limit = 20 } = req.query;
    const result = await dealModel.findAllByUser(req.user.id, { search, stage, page, limit });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function getDeal(req, res, next) {
  try {
    const deal = await dealModel.findById(req.params.id);
    if (!deal || deal.userId !== req.user.id) throw new AppError('Deal not found', 404);
    res.json({ success: true, deal });
  } catch (err) {
    next(err);
  }
}

async function updateDeal(req, res, next) {
  try {
    validateStage(req.body.stage);

    const updates = (({ title, contactId, leadId, value, currency, stage, probability, closeDate, notes }) => ({
      title,
      contactId,
      leadId,
      value,
      currency,
      stage,
      probability,
      closeDate,
      notes,
    }))(req.body);

    Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);
    if (updates.contactId !== undefined) updates.contactId = updates.contactId ? Number(updates.contactId) : null;
    if (updates.leadId !== undefined) updates.leadId = updates.leadId ? Number(updates.leadId) : null;
    if (updates.value !== undefined) updates.value = Number(updates.value) || 0;
    if (updates.probability !== undefined) updates.probability = Number(updates.probability) || 0;

    const deal = await dealModel.updateById(req.params.id, req.user.id, updates);
    if (!deal) throw new AppError('Deal not found', 404);

    if (updates.stage) {
      await runAutomations(req.user.id, 'deal_stage_changed', updates.stage, deal);
    }

    res.json({ success: true, deal });
  } catch (err) {
    next(err);
  }
}

async function deleteDeal(req, res, next) {
  try {
    const deleted = await dealModel.deleteById(req.params.id, req.user.id);
    if (!deleted) throw new AppError('Deal not found', 404);
    res.json({ success: true, message: 'Deal deleted' });
  } catch (err) {
    next(err);
  }
}

async function getPipelineValue(req, res, next) {
  try {
    const summary = await dealModel.pipelineValue(req.user.id);
    res.json({ success: true, summary });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createDeal,
  listDeals,
  getDeal,
  updateDeal,
  deleteDeal,
  getPipelineValue,
};

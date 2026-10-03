const leadModel = require('../models/leadModel');
const { runAutomations } = require('../utils/automationEngine');
const { AppError } = require('../middleware/errorHandler');

async function createLead(req, res, next) {
  try {
    const { name, email, phone, company, source, status, stage, score, notes } = req.body;
    if (!name) throw new AppError('Name is required', 400);

    if (status && !leadModel.VALID_STATUSES.includes(status)) {
      throw new AppError(`Invalid status. Must be one of: ${leadModel.VALID_STATUSES.join(', ')}`, 400);
    }
    if (stage && !leadModel.VALID_STAGES.includes(stage)) {
      throw new AppError(`Invalid stage. Must be one of: ${leadModel.VALID_STAGES.join(', ')}`, 400);
    }

    const lead = await leadModel.create({
      userId: req.user.id,
      name,
      email,
      phone,
      company,
      source,
      status,
      stage,
      score,
      notes,
    });
    res.status(201).json({ success: true, lead });
  } catch (err) {
    next(err);
  }
}

async function listLeads(req, res, next) {
  try {
    const { search = '', status, stage, page = 1, limit = 20 } = req.query;
    const result = await leadModel.findAllByUser(req.user.id, { search, status, stage, page, limit });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function getLead(req, res, next) {
  try {
    const lead = await leadModel.findById(req.params.id);
    if (!lead || lead.userId !== req.user.id) throw new AppError('Lead not found', 404);
    res.json({ success: true, lead });
  } catch (err) {
    next(err);
  }
}

async function updateLead(req, res, next) {
  try {
    const { status, stage } = req.body;
    if (status && !leadModel.VALID_STATUSES.includes(status)) {
      throw new AppError(`Invalid status. Must be one of: ${leadModel.VALID_STATUSES.join(', ')}`, 400);
    }
    if (stage && !leadModel.VALID_STAGES.includes(stage)) {
      throw new AppError(`Invalid stage. Must be one of: ${leadModel.VALID_STAGES.join(', ')}`, 400);
    }

    const updates = (({ name, email, phone, company, source, status, stage, score, notes }) => ({
      name,
      email,
      phone,
      company,
      source,
      status,
      stage,
      score,
      notes,
    }))(req.body);

    Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);

    const lead = await leadModel.updateById(req.params.id, req.user.id, updates);
    if (!lead) throw new AppError('Lead not found', 404);

    if (updates.stage) {
      await runAutomations(req.user.id, 'lead_stage_changed', updates.stage, lead);
    }

    res.json({ success: true, lead });
  } catch (err) {
    next(err);
  }
}

async function deleteLead(req, res, next) {
  try {
    const deleted = await leadModel.deleteById(req.params.id, req.user.id);
    if (!deleted) throw new AppError('Lead not found', 404);
    res.json({ success: true, message: 'Lead deleted' });
  } catch (err) {
    next(err);
  }
}

async function getPipelineSummary(req, res, next) {
  try {
    const summary = await leadModel.pipelineSummary(req.user.id);
    res.json({ success: true, summary });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createLead,
  listLeads,
  getLead,
  updateLead,
  deleteLead,
  getPipelineSummary,
};

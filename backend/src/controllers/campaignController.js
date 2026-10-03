const campaignModel = require('../models/campaignModel');
const contactModel = require('../models/contactModel');
const { sendEmail } = require('../utils/email');
const { AppError } = require('../middleware/errorHandler');

async function createCampaign(req, res, next) {
  try {
    const { name, subject, body, recipientContactIds } = req.body;
    if (!name || !subject || !body) {
      throw new AppError('name, subject, and body are required', 400);
    }
    const campaign = await campaignModel.create({
      userId: req.user.id,
      name,
      subject,
      body,
      recipientContactIds: recipientContactIds || [],
    });
    res.status(201).json({ success: true, campaign });
  } catch (err) {
    next(err);
  }
}

async function listCampaigns(req, res, next) {
  try {
    const campaigns = await campaignModel.findAllByUser(req.user.id);
    res.json({ success: true, campaigns });
  } catch (err) {
    next(err);
  }
}

async function getCampaign(req, res, next) {
  try {
    const campaign = await campaignModel.findById(req.params.id);
    if (!campaign || campaign.userId !== req.user.id) throw new AppError('Campaign not found', 404);
    res.json({ success: true, campaign });
  } catch (err) {
    next(err);
  }
}

async function updateCampaign(req, res, next) {
  try {
    const campaign = await campaignModel.findById(req.params.id);
    if (!campaign || campaign.userId !== req.user.id) throw new AppError('Campaign not found', 404);
    if (campaign.status === 'sent') throw new AppError('Cannot edit a campaign that has already been sent', 400);

    const updates = (({ name, subject, body, recipientContactIds }) => ({ name, subject, body, recipientContactIds }))(req.body);
    Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);

    const updated = await campaignModel.updateById(req.params.id, req.user.id, updates);
    res.json({ success: true, campaign: updated });
  } catch (err) {
    next(err);
  }
}

async function deleteCampaign(req, res, next) {
  try {
    const deleted = await campaignModel.deleteById(req.params.id, req.user.id);
    if (!deleted) throw new AppError('Campaign not found', 404);
    res.json({ success: true, message: 'Campaign deleted' });
  } catch (err) {
    next(err);
  }
}

async function sendCampaign(req, res, next) {
  try {
    const campaign = await campaignModel.findById(req.params.id);
    if (!campaign || campaign.userId !== req.user.id) throw new AppError('Campaign not found', 404);
    if (campaign.status === 'sent') throw new AppError('This campaign has already been sent', 400);
    if (!campaign.recipientContactIds || campaign.recipientContactIds.length === 0) {
      throw new AppError('Add at least one recipient before sending', 400);
    }

    let sentCount = 0;
    let failedCount = 0;

    for (const contactId of campaign.recipientContactIds) {
      const contact = await contactModel.findById(contactId);
      if (!contact || contact.userId !== req.user.id || !contact.email) {
        failedCount++;
        continue;
      }
      try {
        await sendEmail({ to: contact.email, subject: campaign.subject, html: campaign.body });
        sentCount++;
      } catch (err) {
        console.error(`Failed to send campaign email to ${contact.email}:`, err.message);
        failedCount++;
      }
    }

    const updated = await campaignModel.updateById(req.params.id, req.user.id, {
      status: 'sent',
      sentAt: new Date().toISOString(),
      sentCount,
      failedCount,
    });

    res.json({ success: true, campaign: updated });
  } catch (err) {
    next(err);
  }
}

module.exports = { createCampaign, listCampaigns, getCampaign, updateCampaign, deleteCampaign, sendCampaign };

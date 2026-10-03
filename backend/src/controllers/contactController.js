const contactModel = require('../models/contactModel');
const { AppError } = require('../middleware/errorHandler');

async function createContact(req, res, next) {
  try {
    const { name, email, phone, company, tags, notes } = req.body;
    if (!name) throw new AppError('Name is required', 400);

    const contact = await contactModel.create({
      userId: req.user.id,
      name,
      email,
      phone,
      company,
      tags,
      notes,
    });
    res.status(201).json({ success: true, contact });
  } catch (err) {
    next(err);
  }
}

async function listContacts(req, res, next) {
  try {
    const { search = '', page = 1, limit = 20 } = req.query;
    const result = await contactModel.findAllByUser(req.user.id, { search, page, limit });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function getContact(req, res, next) {
  try {
    const contact = await contactModel.findById(req.params.id);
    if (!contact || contact.userId !== req.user.id) {
      throw new AppError('Contact not found', 404);
    }
    res.json({ success: true, contact });
  } catch (err) {
    next(err);
  }
}

async function updateContact(req, res, next) {
  try {
    const updates = (({ name, email, phone, company, tags, notes }) => ({
      name,
      email,
      phone,
      company,
      tags,
      notes,
    }))(req.body);

    Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);

    const contact = await contactModel.updateById(req.params.id, req.user.id, updates);
    if (!contact) throw new AppError('Contact not found', 404);
    res.json({ success: true, contact });
  } catch (err) {
    next(err);
  }
}

async function deleteContact(req, res, next) {
  try {
    const deleted = await contactModel.deleteById(req.params.id, req.user.id);
    if (!deleted) throw new AppError('Contact not found', 404);
    res.json({ success: true, message: 'Contact deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { createContact, listContacts, getContact, updateContact, deleteContact };

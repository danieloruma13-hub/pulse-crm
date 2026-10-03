const eventModel = require('../models/eventModel');
const notificationModel = require('../models/notificationModel');
const { AppError } = require('../middleware/errorHandler');

async function createEvent(req, res, next) {
  try {
    const { title, description, startTime, endTime, location, attendees, relatedType, relatedId } = req.body;
    if (!title || !startTime || !endTime) {
      throw new AppError('Title, startTime, and endTime are required', 400);
    }
    if (new Date(endTime) < new Date(startTime)) {
      throw new AppError('endTime must be after startTime', 400);
    }

    const event = await eventModel.create({
      userId: req.user.id,
      title,
      description,
      startTime,
      endTime,
      location,
      attendees,
      relatedType,
      relatedId,
    });

    await notificationModel.create({
      userId: req.user.id,
      type: 'event_created',
      title: 'New event scheduled',
      message: `"${event.title}" was added to your calendar`,
      relatedType: 'event',
      relatedId: event.id,
    });

    res.status(201).json({ success: true, event });
  } catch (err) {
    next(err);
  }
}

async function listEvents(req, res, next) {
  try {
    const { start, end } = req.query;
    const events = await eventModel.findAllByUser(req.user.id, { start, end });
    res.json({ success: true, events });
  } catch (err) {
    next(err);
  }
}

async function getEvent(req, res, next) {
  try {
    const event = await eventModel.findById(req.params.id);
    if (!event || event.userId !== req.user.id) throw new AppError('Event not found', 404);
    res.json({ success: true, event });
  } catch (err) {
    next(err);
  }
}

async function updateEvent(req, res, next) {
  try {
    const updates = (({ title, description, startTime, endTime, location, attendees, relatedType, relatedId }) => ({
      title,
      description,
      startTime,
      endTime,
      location,
      attendees,
      relatedType,
      relatedId,
    }))(req.body);
    Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);
    if (updates.relatedId !== undefined) updates.relatedId = updates.relatedId ? Number(updates.relatedId) : null;

    const event = await eventModel.updateById(req.params.id, req.user.id, updates);
    if (!event) throw new AppError('Event not found', 404);
    res.json({ success: true, event });
  } catch (err) {
    next(err);
  }
}

async function deleteEvent(req, res, next) {
  try {
    const deleted = await eventModel.deleteById(req.params.id, req.user.id);
    if (!deleted) throw new AppError('Event not found', 404);
    res.json({ success: true, message: 'Event deleted' });
  } catch (err) {
    next(err);
  }
}

async function getUpcomingEvents(req, res, next) {
  try {
    const days = Number(req.query.days) || 7;
    const events = await eventModel.upcoming(req.user.id, days);
    res.json({ success: true, events });
  } catch (err) {
    next(err);
  }
}

module.exports = { createEvent, listEvents, getEvent, updateEvent, deleteEvent, getUpcomingEvents };

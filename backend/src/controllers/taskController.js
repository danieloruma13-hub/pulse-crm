const taskModel = require('../models/taskModel');
const notificationModel = require('../models/notificationModel');
const { AppError } = require('../middleware/errorHandler');

async function createTask(req, res, next) {
  try {
    const { title, description, dueDate, priority, status, relatedType, relatedId } = req.body;
    if (!title) throw new AppError('Title is required', 400);
    if (priority && !taskModel.TASK_PRIORITIES.includes(priority)) {
      throw new AppError(`Invalid priority. Must be one of: ${taskModel.TASK_PRIORITIES.join(', ')}`, 400);
    }
    if (status && !taskModel.TASK_STATUSES.includes(status)) {
      throw new AppError(`Invalid status. Must be one of: ${taskModel.TASK_STATUSES.join(', ')}`, 400);
    }

    const task = await taskModel.create({
      userId: req.user.id,
      title,
      description,
      dueDate,
      priority,
      status,
      relatedType,
      relatedId,
    });

    await notificationModel.create({
      userId: req.user.id,
      type: 'task_created',
      title: 'New task created',
      message: `"${task.title}" was added to your tasks`,
      relatedType: 'task',
      relatedId: task.id,
    });

    res.status(201).json({ success: true, task });
  } catch (err) {
    next(err);
  }
}

async function listTasks(req, res, next) {
  try {
    const { status, priority, page = 1, limit = 20 } = req.query;
    const result = await taskModel.findAllByUser(req.user.id, { status, priority, page, limit });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function getTask(req, res, next) {
  try {
    const task = await taskModel.findById(req.params.id);
    if (!task || task.userId !== req.user.id) throw new AppError('Task not found', 404);
    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
}

async function updateTask(req, res, next) {
  try {
    const { priority, status } = req.body;
    if (priority && !taskModel.TASK_PRIORITIES.includes(priority)) {
      throw new AppError(`Invalid priority. Must be one of: ${taskModel.TASK_PRIORITIES.join(', ')}`, 400);
    }
    if (status && !taskModel.TASK_STATUSES.includes(status)) {
      throw new AppError(`Invalid status. Must be one of: ${taskModel.TASK_STATUSES.join(', ')}`, 400);
    }

    const updates = (({ title, description, dueDate, priority, status, relatedType, relatedId }) => ({
      title,
      description,
      dueDate,
      priority,
      status,
      relatedType,
      relatedId,
    }))(req.body);
    Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);
    if (updates.relatedId !== undefined) updates.relatedId = updates.relatedId ? Number(updates.relatedId) : null;

    const task = await taskModel.updateById(req.params.id, req.user.id, updates);
    if (!task) throw new AppError('Task not found', 404);

    if (updates.status === 'completed') {
      await notificationModel.create({
        userId: req.user.id,
        type: 'task_completed',
        title: 'Task completed',
        message: `"${task.title}" marked as completed`,
        relatedType: 'task',
        relatedId: task.id,
      });
    }

    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
}

async function deleteTask(req, res, next) {
  try {
    const deleted = await taskModel.deleteById(req.params.id, req.user.id);
    if (!deleted) throw new AppError('Task not found', 404);
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
}

async function getUpcomingTasks(req, res, next) {
  try {
    const days = Number(req.query.days) || 7;
    const tasks = await taskModel.upcoming(req.user.id, days);
    res.json({ success: true, tasks });
  } catch (err) {
    next(err);
  }
}

module.exports = { createTask, listTasks, getTask, updateTask, deleteTask, getUpcomingTasks };

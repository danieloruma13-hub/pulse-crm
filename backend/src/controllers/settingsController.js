const settingsModel = require('../models/settingsModel');
const { AppError } = require('../middleware/errorHandler');

async function getSettings(req, res, next) {
  try {
    const settings = await settingsModel.getByUser(req.user.id);
    res.json({ success: true, settings });
  } catch (err) {
    next(err);
  }
}

async function updateSettings(req, res, next) {
  try {
    const { theme, defaultCurrency, timezone, notifications, dashboardLayout } = req.body;

    if (theme && !settingsModel.VALID_THEMES.includes(theme)) {
      throw new AppError(`Invalid theme. Must be one of: ${settingsModel.VALID_THEMES.join(', ')}`, 400);
    }
    if (defaultCurrency && !settingsModel.VALID_CURRENCIES.includes(defaultCurrency)) {
      throw new AppError(`Invalid currency. Must be one of: ${settingsModel.VALID_CURRENCIES.join(', ')}`, 400);
    }
    if (notifications && typeof notifications !== 'object') {
      throw new AppError('notifications must be an object', 400);
    }

    const updates = { theme, defaultCurrency, timezone, notifications, dashboardLayout };
    Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);

    const settings = await settingsModel.updateByUser(req.user.id, updates);
    res.json({ success: true, settings });
  } catch (err) {
    next(err);
  }
}

async function resetSettings(req, res, next) {
  try {
    const settings = await settingsModel.resetByUser(req.user.id);
    res.json({ success: true, settings, message: 'Settings reset to defaults' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSettings, updateSettings, resetSettings };

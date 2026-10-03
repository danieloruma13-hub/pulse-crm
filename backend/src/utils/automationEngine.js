const automationModel = require('../models/automationModel');
const taskModel = require('../models/taskModel');
const notificationModel = require('../models/notificationModel');

async function runAutomations(userId, triggerType, triggerStage, entity) {
  try {
    const rules = await automationModel.findActiveByTrigger(userId, triggerType, triggerStage);
    if (rules.length === 0) return;

    const relatedType = triggerType.startsWith('lead') ? 'lead' : 'deal';
    const entityName = entity.title || entity.name;

    for (const rule of rules) {
      try {
        if (rule.actionType === 'create_task') {
          await taskModel.create({
            userId,
            title: rule.actionConfig.title || `Follow up: ${entityName}`,
            description: `Auto-created by automation "${rule.name}"`,
            priority: rule.actionConfig.priority || 'medium',
            relatedType,
            relatedId: entity.id,
          });
        } else if (rule.actionType === 'create_notification') {
          await notificationModel.create({
            userId,
            type: 'automation',
            title: rule.actionConfig.title || `Automation: ${rule.name}`,
            message: `Triggered for "${entityName}"`,
            relatedType,
            relatedId: entity.id,
          });
        }
        await automationModel.markRun(rule.id);
      } catch (err) {
        console.error(`Automation "${rule.name}" failed:`, err.message);
      }
    }
  } catch (err) {
    console.error('runAutomations error:', err.message);
  }
}

module.exports = { runAutomations };

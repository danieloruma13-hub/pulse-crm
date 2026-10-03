const contactModel = require('../models/contactModel');
const leadModel = require('../models/leadModel');
const dealModel = require('../models/dealModel');
const taskModel = require('../models/taskModel');

function monthKey(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function lastNMonths(n) {
  const months = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

async function overview(req, res, next) {
  try {
    const userId = req.user.id;
    const [contacts, leads, deals, tasks] = await Promise.all([
      contactModel.allByUser(userId),
      leadModel.allByUser(userId),
      dealModel.allByUser(userId),
      taskModel.allByUser(userId),
    ]);

    const wonDeals = deals.filter((d) => d.stage === 'won');
    const totalRevenue = wonDeals.reduce((sum, d) => sum + d.value, 0);
    const openPipelineValue = deals
      .filter((d) => d.stage !== 'won' && d.stage !== 'lost')
      .reduce((sum, d) => sum + d.value, 0);

    res.json({
      success: true,
      overview: {
        totalContacts: contacts.length,
        totalLeads: leads.length,
        totalDeals: deals.length,
        wonDeals: wonDeals.length,
        totalRevenue,
        openPipelineValue,
        pendingTasks: tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length,
        overdueTasks: tasks.filter(
          (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed' && t.status !== 'cancelled'
        ).length,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function revenueTrend(req, res, next) {
  try {
    const months = lastNMonths(Number(req.query.months) || 6);
    const deals = await dealModel.allByUser(req.user.id);
    const wonDeals = deals.filter((d) => d.stage === 'won');

    const byMonth = {};
    for (const m of months) byMonth[m] = 0;
    for (const d of wonDeals) {
      const key = monthKey(d.closeDate || d.updatedAt);
      if (byMonth[key] !== undefined) byMonth[key] += d.value;
    }

    res.json({
      success: true,
      trend: months.map((m) => ({ month: m, revenue: byMonth[m] })),
    });
  } catch (err) {
    next(err);
  }
}

async function leadGrowth(req, res, next) {
  try {
    const months = lastNMonths(Number(req.query.months) || 6);
    const leads = await leadModel.allByUser(req.user.id);

    const byMonth = {};
    for (const m of months) byMonth[m] = 0;
    for (const l of leads) {
      const key = monthKey(l.createdAt);
      if (byMonth[key] !== undefined) byMonth[key] += 1;
    }

    res.json({
      success: true,
      trend: months.map((m) => ({ month: m, newLeads: byMonth[m] })),
    });
  } catch (err) {
    next(err);
  }
}

async function conversionRate(req, res, next) {
  try {
    const leads = await leadModel.allByUser(req.user.id);
    const total = leads.length;
    const converted = leads.filter((l) => l.status === 'converted').length;
    const rate = total > 0 ? Number(((converted / total) * 100).toFixed(1)) : 0;

    res.json({
      success: true,
      conversion: { totalLeads: total, convertedLeads: converted, conversionRate: rate },
    });
  } catch (err) {
    next(err);
  }
}

async function salesPerformance(req, res, next) {
  try {
    const months = lastNMonths(Number(req.query.months) || 6);
    const deals = await dealModel.allByUser(req.user.id);

    const byMonth = {};
    for (const m of months) byMonth[m] = { won: 0, lost: 0 };
    for (const d of deals) {
      if (d.stage !== 'won' && d.stage !== 'lost') continue;
      const key = monthKey(d.updatedAt);
      if (byMonth[key]) byMonth[key][d.stage] += 1;
    }

    res.json({
      success: true,
      trend: months.map((m) => ({ month: m, won: byMonth[m].won, lost: byMonth[m].lost })),
    });
  } catch (err) {
    next(err);
  }
}

async function taskCompletion(req, res, next) {
  try {
    const tasks = await taskModel.allByUser(req.user.id);
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const rate = total > 0 ? Number(((completed / total) * 100).toFixed(1)) : 0;

    res.json({
      success: true,
      taskCompletion: { totalTasks: total, completedTasks: completed, completionRate: rate },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { overview, revenueTrend, leadGrowth, conversionRate, salesPerformance, taskCompletion };

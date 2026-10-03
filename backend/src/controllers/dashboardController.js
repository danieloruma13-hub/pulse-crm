const contactModel = require('../models/contactModel');
const leadModel = require('../models/leadModel');
const dealModel = require('../models/dealModel');
const taskModel = require('../models/taskModel');
const eventModel = require('../models/eventModel');
const notificationModel = require('../models/notificationModel');

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

async function getDashboard(req, res, next) {
  try {
    const userId = req.user.id;

    const [contacts, leads, deals, tasks, upcomingEvents, notificationsResult] = await Promise.all([
      contactModel.allByUser(userId),
      leadModel.allByUser(userId),
      dealModel.allByUser(userId),
      taskModel.allByUser(userId),
      eventModel.upcoming(userId, 7),
      notificationModel.findAllByUser(userId, { page: 1, limit: 6 }),
    ]);

    const wonDeals = deals.filter((d) => d.stage === 'won');
    const totalRevenue = wonDeals.reduce((sum, d) => sum + d.value, 0);
    const openDeals = deals.filter((d) => d.stage !== 'won' && d.stage !== 'lost');

    const convertedLeads = leads.filter((l) => l.status === 'converted').length;
    const conversionRate = leads.length > 0 ? Number(((convertedLeads / leads.length) * 100).toFixed(1)) : 0;

    const monthStart = startOfMonth();
    const newCustomersThisMonth = contacts.filter((c) => new Date(c.createdAt) >= monthStart).length;

    const pipeline = leadModel.VALID_STAGES.map((stage) => {
      const stageLeads = leads.filter((l) => l.stage === stage);
      const stageDeals = deals.filter(
        (d) => stageLeads.some((l) => l.id === d.leadId) || (stage === 'won' && d.stage === 'won')
      );
      return {
        stage,
        leadCount: stageLeads.length,
        value: stageDeals.reduce((sum, d) => sum + d.value, 0),
      };
    });

    const pendingTasks = tasks
      .filter((t) => t.status === 'pending' || t.status === 'in_progress')
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      })
      .slice(0, 6);

    const recentActivity = notificationsResult.data.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      createdAt: n.createdAt,
    }));

    res.json({
      success: true,
      stats: {
        totalLeads: leads.length,
        newCustomersThisMonth,
        revenue: totalRevenue,
        conversionRate,
        activeCampaigns: 0,
        openDeals: openDeals.length,
      },
      pipeline,
      schedule: upcomingEvents.slice(0, 5),
      tasks: pendingTasks,
      recentActivity,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDashboard };

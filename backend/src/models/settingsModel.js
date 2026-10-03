const supabase = require('../config/db');

const VALID_THEMES = ['dark', 'light', 'system'];
const VALID_CURRENCIES = ['USD', 'EUR', 'GBP', 'NGN', 'GHS', 'ZAR'];

const DEFAULT_NOTIFICATIONS = {
  email: true, push: true, taskReminders: true, dealUpdates: true, weeklyDigest: false,
};

function mapSettings(row) {
  if (!row) return null;
  return {
    userId: row.user_id,
    theme: row.theme,
    defaultCurrency: row.default_currency,
    timezone: row.timezone,
    notifications: row.notifications || DEFAULT_NOTIFICATIONS,
    dashboardLayout: row.dashboard_layout,
    updatedAt: row.updated_at,
  };
}

async function getByUser(userId) {
  const { data, error } = await supabase.from('settings').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  if (data) return mapSettings(data);

  const { data: created, error: createError } = await supabase
    .from('settings')
    .insert({ user_id: userId, notifications: DEFAULT_NOTIFICATIONS })
    .select()
    .single();
  if (createError) throw createError;
  return mapSettings(created);
}

async function updateByUser(userId, updates) {
  const current = await getByUser(userId);

  const dbUpdates = { updated_at: new Date().toISOString() };
  if (updates.theme !== undefined) dbUpdates.theme = updates.theme;
  if (updates.defaultCurrency !== undefined) dbUpdates.default_currency = updates.defaultCurrency;
  if (updates.timezone !== undefined) dbUpdates.timezone = updates.timezone;
  if (updates.dashboardLayout !== undefined) dbUpdates.dashboard_layout = updates.dashboardLayout;
  if (updates.notifications !== undefined) {
    dbUpdates.notifications = { ...current.notifications, ...updates.notifications };
  }

  const { data, error } = await supabase.from('settings').update(dbUpdates).eq('user_id', userId).select().single();
  if (error) throw error;
  return mapSettings(data);
}

async function resetByUser(userId) {
  const { data, error } = await supabase
    .from('settings')
    .update({ theme: 'dark', default_currency: 'USD', timezone: 'UTC', notifications: DEFAULT_NOTIFICATIONS, dashboard_layout: 'default', updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .maybeSingle();
  if (error) throw error;
  if (data) return mapSettings(data);
  return getByUser(userId);
}

module.exports = { VALID_THEMES, VALID_CURRENCIES, getByUser, updateByUser, resetByUser };

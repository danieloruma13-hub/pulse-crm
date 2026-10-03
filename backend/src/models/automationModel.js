const supabase = require('../config/db');

const TRIGGER_TYPES = ['lead_stage_changed', 'deal_stage_changed'];
const ACTION_TYPES = ['create_task', 'create_notification'];

function mapAutomation(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    triggerType: row.trigger_type,
    triggerStage: row.trigger_stage,
    actionType: row.action_type,
    actionConfig: row.action_config || {},
    enabled: row.enabled,
    runCount: row.run_count,
    lastRunAt: row.last_run_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function create({ userId, name, triggerType, triggerStage, actionType, actionConfig = {} }) {
  const { data, error } = await supabase
    .from('automations')
    .insert({ user_id: userId, name, trigger_type: triggerType, trigger_stage: triggerStage, action_type: actionType, action_config: actionConfig })
    .select()
    .single();
  if (error) throw error;
  return mapAutomation(data);
}

async function findAllByUser(userId) {
  const { data, error } = await supabase.from('automations').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapAutomation);
}

async function findActiveByTrigger(userId, triggerType, triggerStage) {
  const { data, error } = await supabase
    .from('automations')
    .select('*')
    .eq('user_id', userId)
    .eq('trigger_type', triggerType)
    .eq('trigger_stage', triggerStage)
    .eq('enabled', true);
  if (error) throw error;
  return (data || []).map(mapAutomation);
}

async function updateById(id, userId, updates) {
  const dbUpdates = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.triggerType !== undefined) dbUpdates.trigger_type = updates.triggerType;
  if (updates.triggerStage !== undefined) dbUpdates.trigger_stage = updates.triggerStage;
  if (updates.actionType !== undefined) dbUpdates.action_type = updates.actionType;
  if (updates.actionConfig !== undefined) dbUpdates.action_config = updates.actionConfig;
  if (updates.enabled !== undefined) dbUpdates.enabled = updates.enabled;

  const { data, error } = await supabase.from('automations').update(dbUpdates).eq('id', id).eq('user_id', userId).select().maybeSingle();
  if (error) throw error;
  return mapAutomation(data);
}

async function markRun(id) {
  const { data: current } = await supabase.from('automations').select('run_count').eq('id', id).maybeSingle();
  const nextCount = (current?.run_count || 0) + 1;
  await supabase.from('automations').update({ run_count: nextCount, last_run_at: new Date().toISOString() }).eq('id', id);
}

async function deleteById(id, userId) {
  const { data, error } = await supabase.from('automations').delete().eq('id', id).eq('user_id', userId).select();
  if (error) throw error;
  return (data || []).length > 0;
}

module.exports = { TRIGGER_TYPES, ACTION_TYPES, create, findAllByUser, findActiveByTrigger, updateById, markRun, deleteById };

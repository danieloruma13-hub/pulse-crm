const supabase = require('../config/db');

const TASK_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'];
const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

function mapTask(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description || '',
    dueDate: row.due_date,
    priority: row.priority,
    status: row.status,
    relatedType: row.related_type,
    relatedId: row.related_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function create({ userId, title, description = '', dueDate = null, priority = 'medium', status = 'pending', relatedType = null, relatedId = null }) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: userId, title, description,
      due_date: dueDate || null, priority, status,
      related_type: relatedType,
      related_id: relatedId ? Number(relatedId) : null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapTask(data);
}

async function findAllByUser(userId, { status, priority, page = 1, limit = 20 } = {}) {
  let query = supabase.from('tasks').select('*', { count: 'exact' }).eq('user_id', userId);
  if (status) query = query.eq('status', status);
  if (priority) query = query.eq('priority', priority);

  const start = (page - 1) * limit;
  query = query.order('due_date', { ascending: true, nullsFirst: false }).range(start, start + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: (data || []).map(mapTask), total: count || 0, page: Number(page), limit: Number(limit) };
}

async function findById(id) {
  const { data, error } = await supabase.from('tasks').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return mapTask(data);
}

async function updateById(id, userId, updates) {
  const dbUpdates = { updated_at: new Date().toISOString() };
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.relatedType !== undefined) dbUpdates.related_type = updates.relatedType;
  if (updates.relatedId !== undefined) dbUpdates.related_id = updates.relatedId ? Number(updates.relatedId) : null;

  const { data, error } = await supabase.from('tasks').update(dbUpdates).eq('id', id).eq('user_id', userId).select().maybeSingle();
  if (error) throw error;
  return mapTask(data);
}

async function deleteById(id, userId) {
  const { data, error } = await supabase.from('tasks').delete().eq('id', id).eq('user_id', userId).select();
  if (error) throw error;
  return (data || []).length > 0;
}

async function upcoming(userId, days = 7) {
  const list = await allByUser(userId);
  const now = new Date();
  const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return list.filter((t) => t.status !== 'completed' && t.status !== 'cancelled' && t.dueDate && new Date(t.dueDate) >= now && new Date(t.dueDate) <= cutoff);
}

async function allByUser(userId) {
  const { data, error } = await supabase.from('tasks').select('*').eq('user_id', userId);
  if (error) throw error;
  return (data || []).map(mapTask);
}

module.exports = { TASK_STATUSES, TASK_PRIORITIES, create, findAllByUser, findById, updateById, deleteById, upcoming, allByUser };

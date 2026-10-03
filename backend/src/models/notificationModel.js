const supabase = require('../config/db');

function mapNotification(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    relatedType: row.related_type,
    relatedId: row.related_id,
    read: row.read,
    createdAt: row.created_at,
  };
}

async function create({ userId, type, title, message, relatedType = null, relatedId = null }) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({ user_id: userId, type, title, message, related_type: relatedType, related_id: relatedId ? Number(relatedId) : null })
    .select()
    .single();
  if (error) throw error;
  return mapNotification(data);
}

async function findAllByUser(userId, { unreadOnly = false, page = 1, limit = 20 } = {}) {
  let query = supabase.from('notifications').select('*', { count: 'exact' }).eq('user_id', userId);
  if (unreadOnly) query = query.eq('read', false);

  const start = (page - 1) * limit;
  query = query.order('created_at', { ascending: false }).range(start, start + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  const { count: unreadCount } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('read', false);

  return { data: (data || []).map(mapNotification), total: count || 0, unreadCount: unreadCount || 0, page: Number(page), limit: Number(limit) };
}

async function markAsRead(id, userId) {
  const { data, error } = await supabase.from('notifications').update({ read: true }).eq('id', id).eq('user_id', userId).select().maybeSingle();
  if (error) throw error;
  return mapNotification(data);
}

async function markAllAsRead(userId) {
  const { data, error } = await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false).select();
  if (error) throw error;
  return (data || []).length;
}

async function deleteById(id, userId) {
  const { data, error } = await supabase.from('notifications').delete().eq('id', id).eq('user_id', userId).select();
  if (error) throw error;
  return (data || []).length > 0;
}

module.exports = { create, findAllByUser, markAsRead, markAllAsRead, deleteById };

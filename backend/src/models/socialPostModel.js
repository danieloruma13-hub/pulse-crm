const supabase = require('../config/db');

const PLATFORMS = ['facebook', 'instagram', 'x', 'linkedin'];
const STATUSES = ['draft', 'scheduled', 'posted'];

function mapPost(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    platform: row.platform,
    content: row.content,
    status: row.status,
    scheduledAt: row.scheduled_at,
    postedAt: row.posted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function create({ userId, platform, content, status = 'draft', scheduledAt = null }) {
  const { data, error } = await supabase
    .from('social_posts')
    .insert({ user_id: userId, platform, content, status, scheduled_at: scheduledAt })
    .select()
    .single();
  if (error) throw error;
  return mapPost(data);
}

async function findAllByUser(userId) {
  const { data, error } = await supabase.from('social_posts').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapPost);
}

async function updateById(id, userId, updates) {
  const dbUpdates = { updated_at: new Date().toISOString() };
  if (updates.platform !== undefined) dbUpdates.platform = updates.platform;
  if (updates.content !== undefined) dbUpdates.content = updates.content;
  if (updates.status !== undefined) {
    dbUpdates.status = updates.status;
    if (updates.status === 'posted') dbUpdates.posted_at = new Date().toISOString();
  }
  if (updates.scheduledAt !== undefined) dbUpdates.scheduled_at = updates.scheduledAt;

  const { data, error } = await supabase.from('social_posts').update(dbUpdates).eq('id', id).eq('user_id', userId).select().maybeSingle();
  if (error) throw error;
  return mapPost(data);
}

async function deleteById(id, userId) {
  const { data, error } = await supabase.from('social_posts').delete().eq('id', id).eq('user_id', userId).select();
  if (error) throw error;
  return (data || []).length > 0;
}

module.exports = { PLATFORMS, STATUSES, create, findAllByUser, updateById, deleteById };

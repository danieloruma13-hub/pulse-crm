const supabase = require('../config/db');

function mapEvent(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description || '',
    startTime: row.start_time,
    endTime: row.end_time,
    location: row.location || '',
    attendees: row.attendees || [],
    relatedType: row.related_type,
    relatedId: row.related_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function create({ userId, title, description = '', startTime, endTime, location = '', attendees = [], relatedType = null, relatedId = null }) {
  const { data, error } = await supabase
    .from('events')
    .insert({
      user_id: userId, title, description,
      start_time: startTime, end_time: endTime, location, attendees,
      related_type: relatedType,
      related_id: relatedId ? Number(relatedId) : null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapEvent(data);
}

async function findAllByUser(userId, { start, end } = {}) {
  let query = supabase.from('events').select('*').eq('user_id', userId);
  if (start) query = query.gte('start_time', start);
  if (end) query = query.lte('start_time', end);
  query = query.order('start_time', { ascending: true });

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapEvent);
}

async function findById(id) {
  const { data, error } = await supabase.from('events').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return mapEvent(data);
}

async function updateById(id, userId, updates) {
  const dbUpdates = { updated_at: new Date().toISOString() };
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime;
  if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime;
  if (updates.location !== undefined) dbUpdates.location = updates.location;
  if (updates.attendees !== undefined) dbUpdates.attendees = updates.attendees;
  if (updates.relatedType !== undefined) dbUpdates.related_type = updates.relatedType;
  if (updates.relatedId !== undefined) dbUpdates.related_id = updates.relatedId ? Number(updates.relatedId) : null;

  const { data, error } = await supabase.from('events').update(dbUpdates).eq('id', id).eq('user_id', userId).select().maybeSingle();
  if (error) throw error;
  return mapEvent(data);
}

async function deleteById(id, userId) {
  const { data, error } = await supabase.from('events').delete().eq('id', id).eq('user_id', userId).select();
  if (error) throw error;
  return (data || []).length > 0;
}

async function upcoming(userId, days = 7) {
  const now = new Date();
  const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return findAllByUser(userId, { start: now.toISOString(), end: cutoff.toISOString() });
}

module.exports = { create, findAllByUser, findById, updateById, deleteById, upcoming };

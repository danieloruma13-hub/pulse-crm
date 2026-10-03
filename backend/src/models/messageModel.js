const supabase = require('../config/db');

function mapMessage(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    contactId: row.contact_id,
    direction: row.direction,
    channel: row.channel,
    subject: row.subject || '',
    body: row.body,
    status: row.status,
    createdAt: row.created_at,
  };
}

async function create({ userId, contactId = null, direction = 'outbound', channel = 'email', subject = '', body, status = 'sent' }) {
  const { data, error } = await supabase
    .from('messages')
    .insert({ user_id: userId, contact_id: contactId ? Number(contactId) : null, direction, channel, subject, body, status })
    .select()
    .single();
  if (error) throw error;
  return mapMessage(data);
}

async function findAllByUser(userId, { contactId, channel, page = 1, limit = 20 } = {}) {
  let query = supabase.from('messages').select('*', { count: 'exact' }).eq('user_id', userId);
  if (contactId) query = query.eq('contact_id', Number(contactId));
  if (channel) query = query.eq('channel', channel);

  const start = (page - 1) * limit;
  query = query.order('created_at', { ascending: false }).range(start, start + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: (data || []).map(mapMessage), total: count || 0, page: Number(page), limit: Number(limit) };
}

async function findById(id) {
  const { data, error } = await supabase.from('messages').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return mapMessage(data);
}

async function deleteById(id, userId) {
  const { data, error } = await supabase.from('messages').delete().eq('id', id).eq('user_id', userId).select();
  if (error) throw error;
  return (data || []).length > 0;
}

module.exports = { create, findAllByUser, findById, deleteById };

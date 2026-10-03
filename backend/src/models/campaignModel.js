const supabase = require('../config/db');

function mapCampaign(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    subject: row.subject,
    body: row.body,
    recipientContactIds: row.recipient_contact_ids || [],
    status: row.status,
    sentCount: row.sent_count,
    failedCount: row.failed_count,
    sentAt: row.sent_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function create({ userId, name, subject, body, recipientContactIds = [] }) {
  const { data, error } = await supabase
    .from('campaigns')
    .insert({ user_id: userId, name, subject, body, recipient_contact_ids: recipientContactIds.map(Number) })
    .select()
    .single();
  if (error) throw error;
  return mapCampaign(data);
}

async function findAllByUser(userId) {
  const { data, error } = await supabase.from('campaigns').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapCampaign);
}

async function findById(id) {
  const { data, error } = await supabase.from('campaigns').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return mapCampaign(data);
}

async function updateById(id, userId, updates) {
  const dbUpdates = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.subject !== undefined) dbUpdates.subject = updates.subject;
  if (updates.body !== undefined) dbUpdates.body = updates.body;
  if (updates.recipientContactIds !== undefined) dbUpdates.recipient_contact_ids = updates.recipientContactIds.map(Number);
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.sentAt !== undefined) dbUpdates.sent_at = updates.sentAt;
  if (updates.sentCount !== undefined) dbUpdates.sent_count = updates.sentCount;
  if (updates.failedCount !== undefined) dbUpdates.failed_count = updates.failedCount;

  const { data, error } = await supabase.from('campaigns').update(dbUpdates).eq('id', id).eq('user_id', userId).select().maybeSingle();
  if (error) throw error;
  return mapCampaign(data);
}

async function deleteById(id, userId) {
  const { data, error } = await supabase.from('campaigns').delete().eq('id', id).eq('user_id', userId).select();
  if (error) throw error;
  return (data || []).length > 0;
}

module.exports = { create, findAllByUser, findById, updateById, deleteById };

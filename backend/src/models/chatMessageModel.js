const supabase = require('../config/db');

function mapMessage(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    role: row.role,
    content: row.content,
    metadata: row.metadata,
    createdAt: row.created_at,
  };
}

async function create({ userId, role, content, metadata = null }) {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ user_id: userId, role, content, metadata })
    .select()
    .single();
  if (error) throw error;
  return mapMessage(data);
}

async function findAllByUser(userId, { limit = 50 } = {}) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map(mapMessage).reverse();
}

async function deleteAllByUser(userId) {
  const { data, error } = await supabase.from('chat_messages').delete().eq('user_id', userId).select();
  if (error) throw error;
  return (data || []).length;
}

module.exports = { create, findAllByUser, deleteAllByUser };

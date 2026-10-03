const supabase = require('../config/db');

function mapContact(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    email: row.email || '',
    phone: row.phone || '',
    company: row.company || '',
    tags: row.tags || [],
    notes: row.notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function create({ userId, name, email, phone, company, tags = [], notes = '' }) {
  const { data, error } = await supabase
    .from('contacts')
    .insert({ user_id: userId, name, email: email || '', phone: phone || '', company: company || '', tags, notes })
    .select()
    .single();
  if (error) throw error;
  return mapContact(data);
}

async function findAllByUser(userId, { search = '', page = 1, limit = 20 } = {}) {
  let query = supabase.from('contacts').select('*', { count: 'exact' }).eq('user_id', userId);

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`);
  }

  const start = (page - 1) * limit;
  query = query.order('created_at', { ascending: false }).range(start, start + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return { data: (data || []).map(mapContact), total: count || 0, page: Number(page), limit: Number(limit) };
}

async function findById(id) {
  const { data, error } = await supabase.from('contacts').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return mapContact(data);
}

async function updateById(id, userId, updates) {
  const dbUpdates = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.company !== undefined) dbUpdates.company = updates.company;
  if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

  const { data, error } = await supabase
    .from('contacts')
    .update(dbUpdates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return mapContact(data);
}

async function deleteById(id, userId) {
  const { data, error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select();
  if (error) throw error;
  return (data || []).length > 0;
}

async function allByUser(userId) {
  const { data, error } = await supabase.from('contacts').select('*').eq('user_id', userId);
  if (error) throw error;
  return (data || []).map(mapContact);
}

module.exports = { create, findAllByUser, findById, updateById, deleteById, allByUser };

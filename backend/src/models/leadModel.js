const supabase = require('../config/db');

const VALID_STATUSES = ['new', 'contacted', 'qualified', 'unqualified', 'converted'];
const VALID_STAGES = ['inbox', 'discovery', 'proposal', 'negotiation', 'won', 'lost'];

function mapLead(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    email: row.email || '',
    phone: row.phone || '',
    company: row.company || '',
    source: row.source,
    status: row.status,
    stage: row.stage,
    score: row.score,
    notes: row.notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function create({ userId, name, email, phone = '', company = '', source = 'other', status = 'new', stage = 'inbox', score = 0, notes = '' }) {
  const { data, error } = await supabase
    .from('leads')
    .insert({ user_id: userId, name, email: email || '', phone, company, source, status, stage, score: Number(score) || 0, notes })
    .select()
    .single();
  if (error) throw error;
  return mapLead(data);
}

async function findAllByUser(userId, { search = '', status, stage, page = 1, limit = 20 } = {}) {
  let query = supabase.from('leads').select('*', { count: 'exact' }).eq('user_id', userId);

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`);
  }
  if (status) query = query.eq('status', status);
  if (stage) query = query.eq('stage', stage);

  const start = (page - 1) * limit;
  query = query.order('created_at', { ascending: false }).range(start, start + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return { data: (data || []).map(mapLead), total: count || 0, page: Number(page), limit: Number(limit) };
}

async function findById(id) {
  const { data, error } = await supabase.from('leads').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return mapLead(data);
}

async function updateById(id, userId, updates) {
  const dbUpdates = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.company !== undefined) dbUpdates.company = updates.company;
  if (updates.source !== undefined) dbUpdates.source = updates.source;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.stage !== undefined) dbUpdates.stage = updates.stage;
  if (updates.score !== undefined) dbUpdates.score = Number(updates.score) || 0;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

  const { data, error } = await supabase
    .from('leads')
    .update(dbUpdates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return mapLead(data);
}

async function deleteById(id, userId) {
  const { data, error } = await supabase.from('leads').delete().eq('id', id).eq('user_id', userId).select();
  if (error) throw error;
  return (data || []).length > 0;
}

async function pipelineSummary(userId) {
  const list = await allByUser(userId);
  const summary = {};
  for (const stage of VALID_STAGES) {
    summary[stage] = list.filter((l) => l.stage === stage).length;
  }
  return summary;
}

async function allByUser(userId) {
  const { data, error } = await supabase.from('leads').select('*').eq('user_id', userId);
  if (error) throw error;
  return (data || []).map(mapLead);
}

module.exports = { VALID_STATUSES, VALID_STAGES, create, findAllByUser, findById, updateById, deleteById, pipelineSummary, allByUser };

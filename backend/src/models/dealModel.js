const supabase = require('../config/db');

const VALID_STAGES = ['prospecting', 'qualification', 'proposal', 'negotiation', 'won', 'lost'];

function mapDeal(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    contactId: row.contact_id,
    leadId: row.lead_id,
    value: Number(row.value) || 0,
    currency: row.currency,
    stage: row.stage,
    probability: row.probability,
    closeDate: row.close_date,
    notes: row.notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function create({ userId, title, contactId = null, leadId = null, value = 0, currency = 'USD', stage = 'prospecting', probability = 10, closeDate = null, notes = '' }) {
  const { data, error } = await supabase
    .from('deals')
    .insert({
      user_id: userId, title,
      contact_id: contactId ? Number(contactId) : null,
      lead_id: leadId ? Number(leadId) : null,
      value: Number(value) || 0, currency, stage,
      probability: Number(probability) || 0,
      close_date: closeDate || null, notes,
    })
    .select()
    .single();
  if (error) throw error;
  return mapDeal(data);
}

async function findAllByUser(userId, { search = '', stage, page = 1, limit = 20 } = {}) {
  let query = supabase.from('deals').select('*', { count: 'exact' }).eq('user_id', userId);
  if (search) query = query.ilike('title', `%${search}%`);
  if (stage) query = query.eq('stage', stage);

  const start = (page - 1) * limit;
  query = query.order('created_at', { ascending: false }).range(start, start + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: (data || []).map(mapDeal), total: count || 0, page: Number(page), limit: Number(limit) };
}

async function findById(id) {
  const { data, error } = await supabase.from('deals').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return mapDeal(data);
}

async function updateById(id, userId, updates) {
  const dbUpdates = { updated_at: new Date().toISOString() };
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.contactId !== undefined) dbUpdates.contact_id = updates.contactId ? Number(updates.contactId) : null;
  if (updates.leadId !== undefined) dbUpdates.lead_id = updates.leadId ? Number(updates.leadId) : null;
  if (updates.value !== undefined) dbUpdates.value = Number(updates.value) || 0;
  if (updates.currency !== undefined) dbUpdates.currency = updates.currency;
  if (updates.stage !== undefined) dbUpdates.stage = updates.stage;
  if (updates.probability !== undefined) dbUpdates.probability = Number(updates.probability) || 0;
  if (updates.closeDate !== undefined) dbUpdates.close_date = updates.closeDate;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

  const { data, error } = await supabase.from('deals').update(dbUpdates).eq('id', id).eq('user_id', userId).select().maybeSingle();
  if (error) throw error;
  return mapDeal(data);
}

async function deleteById(id, userId) {
  const { data, error } = await supabase.from('deals').delete().eq('id', id).eq('user_id', userId).select();
  if (error) throw error;
  return (data || []).length > 0;
}

async function pipelineValue(userId) {
  const list = await allByUser(userId);
  const summary = {};
  for (const stage of VALID_STAGES) {
    const stageDeals = list.filter((d) => d.stage === stage);
    summary[stage] = { count: stageDeals.length, totalValue: stageDeals.reduce((sum, d) => sum + d.value, 0) };
  }
  return summary;
}

async function allByUser(userId) {
  const { data, error } = await supabase.from('deals').select('*').eq('user_id', userId);
  if (error) throw error;
  return (data || []).map(mapDeal);
}

module.exports = { VALID_STAGES, create, findAllByUser, findById, updateById, deleteById, pipelineValue, allByUser };

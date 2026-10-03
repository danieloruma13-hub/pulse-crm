const supabase = require('../config/db');

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    resetToken: row.reset_token,
    resetTokenExpires: row.reset_token_expires,
    createdAt: row.created_at,
  };
}

async function findByEmail(email) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .maybeSingle();
  if (error) throw error;
  return mapUser(data);
}

async function findById(id) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return mapUser(data);
}

async function create({ name, email, passwordHash }) {
  const { data, error } = await supabase
    .from('users')
    .insert({ name, email: email.toLowerCase(), password_hash: passwordHash, role: 'user' })
    .select()
    .single();
  if (error) throw error;
  return mapUser(data);
}

async function updateById(id, updates) {
  const dbUpdates = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  if (updates.passwordHash !== undefined) dbUpdates.password_hash = updates.passwordHash;
  if (updates.resetToken !== undefined) dbUpdates.reset_token = updates.resetToken;
  if (updates.resetTokenExpires !== undefined) dbUpdates.reset_token_expires = updates.resetTokenExpires;

  const { data, error } = await supabase
    .from('users')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return mapUser(data);
}

async function setResetToken(email, token, expires) {
  const { data, error } = await supabase
    .from('users')
    .update({ reset_token: token, reset_token_expires: expires })
    .eq('email', email.toLowerCase())
    .select()
    .maybeSingle();
  if (error) throw error;
  return mapUser(data);
}

async function findByResetToken(token) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('reset_token', token)
    .gt('reset_token_expires', Date.now())
    .maybeSingle();
  if (error) throw error;
  return mapUser(data);
}

module.exports = { findByEmail, findById, create, updateById, setResetToken, findByResetToken };

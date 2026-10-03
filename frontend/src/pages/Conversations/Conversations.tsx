import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Mail, MessageCircle, Phone, MessageSquare, X } from "lucide-react";
import AppLayout from "../../components/Layout/AppLayout";
import api from "../../lib/api";
import styles from "./Conversations.module.css";

const CHANNELS = ['email', 'whatsapp', 'sms', 'call', 'messenger', 'other'];
const CHANNEL_ICONS = {
  email: Mail,
  whatsapp: MessageCircle,
  sms: MessageSquare,
  call: Phone,
  messenger: MessageCircle,
  other: MessageSquare,
};

const emptyForm = { contactId: '', channel: 'email', direction: 'outbound', subject: '', body: '' };

function timeAgo(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function Conversations() {
  const [messages, setMessages] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [channelFilter, setChannelFilter] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const contactMap = Object.fromEntries(contacts.map((c) => [c.id, c.name]));

  const loadMessages = useCallback((channel = '') => {
    const qs = channel ? `?channel=${channel}` : '';
    api.get(`/messages${qs}`)
      .then(({ data }) => { setMessages(data.data); setError(''); })
      .catch((err) => setError(err.response?.data?.message || 'Could not load conversations'));
  }, []);

  useEffect(() => {
    loadMessages();
    api.get('/contacts?limit=100').then(({ data }) => setContacts(data.data)).catch(() => {});
  }, [loadMessages]);

  useEffect(() => {
    loadMessages(channelFilter);
  }, [channelFilter, loadMessages]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.body.trim()) return;
    setSaving(true);
    setError('');
    try {
      const payload = { ...formData };
      if (!payload.contactId) delete payload.contactId;
      await api.post('/messages', payload);
      setFormData(emptyForm);
      setShowForm(false);
      loadMessages(channelFilter);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not log conversation');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await api.delete(`/messages/${id}`);
      loadMessages(channelFilter);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AppLayout
      title="Conversations"
      subtitle="Every interaction with your contacts, in one place"
      actions={
        <button className={styles.addBtn} onClick={() => setShowForm(true)}>
          <Plus size={16} /> Log Conversation
        </button>
      }
    >
      <div className={styles.filterRow}>
        <button className={`${styles.filterChip} ${channelFilter === '' ? styles.filterChipActive : ''}`} onClick={() => setChannelFilter('')}>
          All
        </button>
        {CHANNELS.map((c) => (
          <button
            key={c}
            className={`${styles.filterChip} ${channelFilter === c ? styles.filterChipActive : ''}`}
            onClick={() => setChannelFilter(c)}
          >
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {messages === null ? (
        <div className={styles.empty}>Loading conversations...</div>
      ) : messages.length === 0 ? (
        <div className={styles.empty}>
          {channelFilter ? `No ${channelFilter} conversations yet.` : 'No conversations logged yet. Log your first interaction to get started.'}
        </div>
      ) : (
        <div className={styles.list}>
          {messages.map((msg) => {
            const Icon = CHANNEL_ICONS[msg.channel] || MessageSquare;
            return (
              <div key={msg.id} className={styles.item}>
                <div className={styles.iconWrap}>
                  <Icon size={16} />
                </div>
                <div className={styles.itemBody}>
                  <div className={styles.itemHeader}>
                    <span className={styles.contactName}>
                      {msg.contactId ? (contactMap[msg.contactId] || 'Unknown contact') : 'No contact linked'}
                    </span>
                    <span className={styles.direction}>{msg.direction}</span>
                    <span className={styles.time}>{timeAgo(msg.createdAt)}</span>
                  </div>
                  {msg.subject && <div className={styles.subject}>{msg.subject}</div>}
                  <p className={styles.bodyText}>{msg.body}</p>
                </div>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(msg.id)}
                  disabled={deletingId === msg.id}
                  aria-label="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className={styles.modalOverlay} onClick={() => setShowForm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Log Conversation</h2>
              <button onClick={() => setShowForm(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label>Contact</label>
                <select
                  value={formData.contactId}
                  onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                >
                  <option value="">No contact</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label>Channel</label>
                  <select
                    value={formData.channel}
                    onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                  >
                    {CHANNELS.map((c) => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Direction</label>
                  <select
                    value={formData.direction}
                    onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
                  >
                    <option value="outbound">Outbound</option>
                    <option value="inbound">Inbound</option>
                  </select>
                </div>
              </div>

              <div className={styles.field}>
                <label>Subject (optional)</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
              </div>

              <div className={styles.field}>
                <label>Message *</label>
                <textarea
                  rows={4}
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  required
                />
              </div>

              <button type="submit" className={styles.submitBtn} disabled={saving}>
                {saving ? 'Saving...' : 'Log Conversation'}
              </button>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

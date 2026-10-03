import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Send, X, CheckSquare, Square } from "lucide-react";
import AppLayout from "../../components/Layout/AppLayout";
import api from "../../lib/api";
import styles from "./EmailCampaigns.module.css";

const emptyForm = { name: '', subject: '', body: '', recipientContactIds: [] };

function timeAgo(isoString) {
  if (!isoString) return '';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function EmailCampaigns() {
  const [campaigns, setCampaigns] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [sendingId, setSendingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const contactMap = Object.fromEntries(contacts.map((c) => [c.id, c]));

  const loadCampaigns = useCallback(() => {
    api.get('/campaigns')
      .then(({ data }) => { setCampaigns(data.campaigns); setError(''); })
      .catch((err) => setError(err.response?.data?.message || 'Could not load campaigns'));
  }, []);

  useEffect(() => {
    loadCampaigns();
    api.get('/contacts?limit=100').then(({ data }) => setContacts(data.data)).catch(() => {});
  }, [loadCampaigns]);

  function toggleRecipient(id) {
    setFormData((prev) => {
      const has = prev.recipientContactIds.includes(id);
      return {
        ...prev,
        recipientContactIds: has
          ? prev.recipientContactIds.filter((r) => r !== id)
          : [...prev.recipientContactIds, id],
      };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.name.trim() || !formData.subject.trim() || !formData.body.trim()) return;
    setSaving(true);
    setError('');
    try {
      const payload = { ...formData, body: `<p>${formData.body.replace(/\n/g, '</p><p>')}</p>` };
      await api.post('/campaigns', payload);
      setFormData(emptyForm);
      setShowForm(false);
      loadCampaigns();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create campaign');
    } finally {
      setSaving(false);
    }
  }

  async function handleSend(id) {
    setSendingId(id);
    setError('');
    try {
      await api.post(`/campaigns/${id}/send`);
      loadCampaigns();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send campaign');
    } finally {
      setSendingId(null);
    }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await api.delete(`/campaigns/${id}`);
      loadCampaigns();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete campaign');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AppLayout
      title="Email Campaigns"
      subtitle="Send real emails to your contacts, straight from your CRM"
      actions={
        <button className={styles.addBtn} onClick={() => setShowForm(true)}>
          <Plus size={16} /> New Campaign
        </button>
      }
    >
      {error && <div className={styles.error}>{error}</div>}

      {campaigns === null ? (
        <div className={styles.empty}>Loading campaigns...</div>
      ) : campaigns.length === 0 ? (
        <div className={styles.empty}>No campaigns yet. Create your first one to get started.</div>
      ) : (
        <div className={styles.list}>
          {campaigns.map((c) => (
            <div key={c.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div>
                  <h3>{c.name}</h3>
                  <p className={styles.subject}>{c.subject}</p>
                </div>
                <span className={`${styles.badge} ${c.status === 'sent' ? styles.badgeSent : styles.badgeDraft}`}>
                  {c.status}
                </span>
              </div>

              <div className={styles.meta}>
                {c.status === 'sent' ? (
                  <span>Sent {timeAgo(c.sentAt)} · {c.sentCount} delivered, {c.failedCount} failed</span>
                ) : (
                  <span>{c.recipientContactIds.length} recipient{c.recipientContactIds.length === 1 ? '' : 's'} selected</span>
                )}
              </div>

              <div className={styles.recipients}>
                {c.recipientContactIds.slice(0, 4).map((id) => (
                  <span key={id} className={styles.recipientChip}>
                    {contactMap[id]?.name || `Contact #${id}`}
                  </span>
                ))}
                {c.recipientContactIds.length > 4 && (
                  <span className={styles.recipientChip}>+{c.recipientContactIds.length - 4} more</span>
                )}
              </div>

              <div className={styles.actions}>
                {c.status === 'draft' && (
                  <button
                    className={styles.sendBtn}
                    onClick={() => handleSend(c.id)}
                    disabled={sendingId === c.id || c.recipientContactIds.length === 0}
                  >
                    <Send size={14} /> {sendingId === c.id ? 'Sending...' : 'Send Now'}
                  </button>
                )}
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(c.id)}
                  disabled={deletingId === c.id}
                  aria-label="Delete campaign"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className={styles.modalOverlay} onClick={() => setShowForm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>New Campaign</h2>
              <button onClick={() => setShowForm(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label>Campaign name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className={styles.field}>
                <label>Subject line *</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                />
              </div>

              <div className={styles.field}>
                <label>Message *</label>
                <textarea
                  rows={5}
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  placeholder="Write your email. Line breaks become paragraphs."
                  required
                />
              </div>

              <div className={styles.field}>
                <label>Recipients ({formData.recipientContactIds.length} selected)</label>
                <div className={styles.recipientPicker}>
                  {contacts.length === 0 ? (
                    <p className={styles.noContacts}>No contacts yet — add contacts first to email them.</p>
                  ) : (
                    contacts.map((c) => {
                      const selected = formData.recipientContactIds.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          className={styles.recipientRow}
                          onClick={() => toggleRecipient(c.id)}
                        >
                          {selected ? <CheckSquare size={16} /> : <Square size={16} />}
                          <span>{c.name}</span>
                          <span className={styles.recipientEmail}>{c.email || 'no email'}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <button type="submit" className={styles.submitBtn} disabled={saving}>
                {saving ? 'Saving...' : 'Save as Draft'}
              </button>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

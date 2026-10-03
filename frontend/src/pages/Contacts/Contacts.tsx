import { useEffect, useState, useCallback } from "react";
import { Plus, Search, Trash2, Mail, Phone, Building2, X, Sparkles } from "lucide-react";
import AppLayout from "../../components/Layout/AppLayout";
import api from "../../lib/api";
import styles from "./Contacts.module.css";

function parseEmail(text) {
  const match = text.match(/^Subject:\s*(.*?)\n+([\s\S]*)$/i);
  if (match) return { subject: match[1].trim(), body: match[2].trim() };
  return { subject: '(no subject)', body: text.trim() };
}

export default function Contacts() {
  const [contacts, setContacts] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', company: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [draftFor, setDraftFor] = useState(null);
  const [draftResult, setDraftResult] = useState(null);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftError, setDraftError] = useState('');
  const [draftSent, setDraftSent] = useState(false);

  const loadContacts = useCallback((query = '') => {
    api.get(`/contacts${query ? `?search=${encodeURIComponent(query)}` : ''}`)
      .then(({ data }) => { setContacts(data.data); setError(''); })
      .catch((err) => setError(err.response?.data?.message || 'Could not load contacts'));
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    const timeout = setTimeout(() => loadContacts(search), 350);
    return () => clearTimeout(timeout);
  }, [search, loadContacts]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setSaving(true);
    setError('');
    try {
      await api.post('/contacts', formData);
      setFormData({ name: '', email: '', phone: '', company: '', notes: '' });
      setShowForm(false);
      loadContacts(search);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create contact');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await api.delete(`/contacts/${id}`);
      loadContacts(search);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete contact');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSendAIEmail(contact) {
    setDraftFor(contact);
    setDraftResult(null);
    setDraftError('');
    setDraftSent(false);
    setDraftLoading(true);
    try {
      const { data } = await api.post('/ai/generate-email', { contactId: contact.id, tone: 'professional' });
      const parsed = parseEmail(data.email);
      setDraftResult(parsed);

      const bodyHtml = `<p>${parsed.body.replace(/\n/g, '</p><p>')}</p>`;
      const { data: campaignData } = await api.post('/campaigns', {
        name: `AI Email - ${contact.name}`,
        subject: parsed.subject,
        body: bodyHtml,
        recipientContactIds: [contact.id],
      });
      await api.post(`/campaigns/${campaignData.campaign.id}/send`);
      setDraftSent(true);
    } catch (err) {
      setDraftError(err.response?.data?.message || 'Could not send email');
    } finally {
      setDraftLoading(false);
    }
  }

  function closeDraftModal() {
    setDraftFor(null);
    setDraftResult(null);
    setDraftError('');
    setDraftSent(false);
  }

  return (
    <AppLayout
      title="Contacts"
      subtitle="Everyone you're building a relationship with"
      actions={
        <button className={styles.addBtn} onClick={() => setShowForm(true)}>
          <Plus size={16} /> Add Contact
        </button>
      }
    >
      <div className={styles.searchBar}>
        <Search size={16} />
        <input
          type="text"
          placeholder="Search by name, email, or company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {contacts === null ? (
        <div className={styles.empty}>Loading contacts...</div>
      ) : contacts.length === 0 ? (
        <div className={styles.empty}>
          {search ? 'No contacts match your search.' : 'No contacts yet. Add your first one to get started.'}
        </div>
      ) : (
        <div className={styles.grid}>
          {contacts.map((contact) => (
            <div key={contact.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.avatar}>{contact.name.charAt(0).toUpperCase()}</div>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(contact.id)}
                  disabled={deletingId === contact.id}
                  aria-label="Delete contact"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <h3>{contact.name}</h3>
              {contact.company && (
                <div className={styles.detail}>
                  <Building2 size={13} /> {contact.company}
                </div>
              )}
              {contact.email && (
                <div className={styles.detail}>
                  <Mail size={13} /> {contact.email}
                </div>
              )}
              {contact.phone && (
                <div className={styles.detail}>
                  <Phone size={13} /> {contact.phone}
                </div>
              )}

              {contact.email && (
                <button className={styles.draftBtn} onClick={() => handleSendAIEmail(contact)}>
                  <Sparkles size={14} /> Send AI Email
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className={styles.modalOverlay} onClick={() => setShowForm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Add Contact</h2>
              <button onClick={() => setShowForm(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className={styles.field}>
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label>Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label>Company</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label>Notes</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <button type="submit" className={styles.submitBtn} disabled={saving}>
                {saving ? 'Saving...' : 'Save Contact'}
              </button>
            </form>
          </div>
        </div>
      )}

      {draftFor && (
        <div className={styles.modalOverlay} onClick={closeDraftModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{draftSent ? `Email sent to ${draftFor.name}` : `Emailing ${draftFor.name}`}</h2>
              <button onClick={closeDraftModal} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            {draftLoading && <p className={styles.draftStatus}>Writing and sending with AI...</p>}
            {draftError && <div className={styles.error}>{draftError}</div>}

            {draftResult && (
              <>
                <div className={styles.field}>
                  <label>Subject</label>
                  <input type="text" value={draftResult.subject} readOnly />
                </div>
                <div className={styles.field}>
                  <label>Body</label>
                  <textarea rows={8} value={draftResult.body} readOnly />
                </div>

                {draftSent && (
                  <div className={styles.successMsg}>Sent to {draftFor.email}</div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}

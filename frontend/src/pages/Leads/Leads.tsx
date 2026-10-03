import { useEffect, useState, useCallback } from "react";
import { Plus, Search, Trash2, Building2, X } from "lucide-react";
import AppLayout from "../../components/Layout/AppLayout";
import api from "../../lib/api";
import styles from "./Leads.module.css";

const STAGES = ['inbox', 'discovery', 'proposal', 'negotiation', 'won', 'lost'];
const STAGE_LABELS = {
  inbox: 'New Lead',
  discovery: 'Discovery',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  won: 'Closed Won',
  lost: 'Lost',
};
const SOURCES = ['website', 'referral', 'social', 'email', 'event', 'other'];

const emptyForm = { name: '', email: '', phone: '', company: '', source: 'other', stage: 'inbox', score: 50, notes: '' };

export default function Leads() {
  const [leads, setLeads] = useState(null);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadLeads = useCallback((query = '', stage = '') => {
    const params = new URLSearchParams();
    if (query) params.set('search', query);
    if (stage) params.set('stage', stage);
    const qs = params.toString();
    api.get(`/leads${qs ? `?${qs}` : ''}`)
      .then(({ data }) => { setLeads(data.data); setError(''); })
      .catch((err) => setError(err.response?.data?.message || 'Could not load leads'));
  }, []);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  useEffect(() => {
    const timeout = setTimeout(() => loadLeads(search, stageFilter), 350);
    return () => clearTimeout(timeout);
  }, [search, stageFilter, loadLeads]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setSaving(true);
    setError('');
    try {
      await api.post('/leads', formData);
      setFormData(emptyForm);
      setShowForm(false);
      loadLeads(search, stageFilter);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create lead');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await api.delete(`/leads/${id}`);
      loadLeads(search, stageFilter);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete lead');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleStageChange(id, newStage) {
    try {
      await api.patch(`/leads/${id}`, { stage: newStage });
      loadLeads(search, stageFilter);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update stage');
    }
  }

  return (
    <AppLayout
      title="Leads"
      subtitle="Prospects moving through your pipeline"
      actions={
        <button className={styles.addBtn} onClick={() => setShowForm(true)}>
          <Plus size={16} /> Add Lead
        </button>
      }
    >
      <div className={styles.filterRow}>
        <div className={styles.searchBar}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by name, email, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select className={styles.stageSelect} value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
          <option value="">All stages</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>{STAGE_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {leads === null ? (
        <div className={styles.empty}>Loading leads...</div>
      ) : leads.length === 0 ? (
        <div className={styles.empty}>
          {search || stageFilter ? 'No leads match your filters.' : 'No leads yet. Add your first one to get started.'}
        </div>
      ) : (
        <div className={styles.grid}>
          {leads.map((lead) => (
            <div key={lead.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.avatar}>{lead.name.charAt(0).toUpperCase()}</div>
                <div className={styles.scoreBadge} data-hot={lead.score >= 70}>
                  {lead.score}
                </div>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(lead.id)}
                  disabled={deletingId === lead.id}
                  aria-label="Delete lead"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <h3>{lead.name}</h3>
              {lead.company && (
                <div className={styles.detail}>
                  <Building2 size={13} /> {lead.company}
                </div>
              )}

              <select
                className={styles.inlineStageSelect}
                value={lead.stage}
                onChange={(e) => handleStageChange(lead.id, e.target.value)}
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className={styles.modalOverlay} onClick={() => setShowForm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Add Lead</h2>
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
                <label>Company</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label>Source</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  >
                    {SOURCES.map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Stage</label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                  >
                    {STAGES.map((s) => (
                      <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={styles.field}>
                <label>Score (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.score}
                  onChange={(e) => setFormData({ ...formData, score: Number(e.target.value) })}
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
                {saving ? 'Saving...' : 'Save Lead'}
              </button>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

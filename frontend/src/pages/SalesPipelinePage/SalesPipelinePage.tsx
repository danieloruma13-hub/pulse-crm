import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, X } from "lucide-react";
import AppLayout from "../../components/Layout/AppLayout";
import api from "../../lib/api";
import styles from "./SalesPipelinePage.module.css";

const STAGES = ['prospecting', 'qualification', 'proposal', 'negotiation', 'won', 'lost'];
const STAGE_LABELS = {
  prospecting: 'Prospecting',
  qualification: 'Qualification',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  won: 'Closed Won',
  lost: 'Lost',
};

const emptyForm = { title: '', value: '', currency: 'USD', stage: 'prospecting', probability: 20, closeDate: '', contactId: '', leadId: '', notes: '' };

function formatCurrency(value, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value || 0);
}

export default function SalesPipelinePage() {
  const [deals, setDeals] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [leads, setLeads] = useState([]);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadDeals = useCallback(() => {
    api.get('/deals?limit=200')
      .then(({ data }) => { setDeals(data.data); setError(''); })
      .catch((err) => setError(err.response?.data?.message || 'Could not load deals'));
  }, []);

  useEffect(() => {
    loadDeals();
    api.get('/contacts?limit=100').then(({ data }) => setContacts(data.data)).catch(() => {});
    api.get('/leads?limit=100').then(({ data }) => setLeads(data.data)).catch(() => {});
  }, [loadDeals]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.title.trim()) return;
    setSaving(true);
    setError('');
    try {
      const payload = { ...formData };
      if (!payload.contactId) delete payload.contactId;
      if (!payload.leadId) delete payload.leadId;
      if (!payload.closeDate) delete payload.closeDate;
      await api.post('/deals', payload);
      setFormData(emptyForm);
      setShowForm(false);
      loadDeals();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create deal');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await api.delete(`/deals/${id}`);
      loadDeals();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete deal');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleStageChange(id, newStage) {
    try {
      await api.patch(`/deals/${id}`, { stage: newStage });
      loadDeals();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update stage');
    }
  }

  const grouped = STAGES.map((stage) => ({
    stage,
    deals: (deals || []).filter((d) => d.stage === stage),
  }));

  return (
    <AppLayout
      title="Sales Pipeline"
      subtitle="Track every deal from first contact to close"
      actions={
        <button className={styles.addBtn} onClick={() => setShowForm(true)}>
          <Plus size={16} /> Add Deal
        </button>
      }
    >
      {error && <div className={styles.error}>{error}</div>}

      {deals === null ? (
        <div className={styles.empty}>Loading pipeline...</div>
      ) : deals.length === 0 ? (
        <div className={styles.empty}>No deals yet. Add your first one to start tracking your pipeline.</div>
      ) : (
        <div className={styles.board}>
          {grouped.map(({ stage, deals: stageDeals }) => {
            const stageTotal = stageDeals.reduce((sum, d) => sum + d.value, 0);
            return (
              <div key={stage} className={styles.column}>
                <div className={styles.columnHeader}>
                  <h3>{STAGE_LABELS[stage]}</h3>
                  <span>{stageDeals.length} · {formatCurrency(stageTotal)}</span>
                </div>

                <div className={styles.columnBody}>
                  {stageDeals.length === 0 ? (
                    <div className={styles.columnEmpty}>No deals</div>
                  ) : (
                    stageDeals.map((deal) => (
                      <div key={deal.id} className={styles.card}>
                        <div className={styles.cardTop}>
                          <h4>{deal.title}</h4>
                          <button
                            className={styles.deleteBtn}
                            onClick={() => handleDelete(deal.id)}
                            disabled={deletingId === deal.id}
                            aria-label="Delete deal"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className={styles.cardValue}>{formatCurrency(deal.value, deal.currency)}</div>
                        <div className={styles.cardMeta}>
                          {deal.probability}% probability
                          {deal.closeDate && ` · closes ${new Date(deal.closeDate).toLocaleDateString()}`}
                        </div>
                        <select
                          className={styles.stageSelect}
                          value={deal.stage}
                          onChange={(e) => handleStageChange(deal.id, e.target.value)}
                        >
                          {STAGES.map((s) => (
                            <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                          ))}
                        </select>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className={styles.modalOverlay} onClick={() => setShowForm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Add Deal</h2>
              <button onClick={() => setShowForm(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label>Value</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  />
                </div>
                <div className={styles.field}>
                  <label>Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="NGN">NGN</option>
                    <option value="GHS">GHS</option>
                  </select>
                </div>
              </div>

              <div className={styles.fieldRow}>
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
                <div className={styles.field}>
                  <label>Probability (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.probability}
                    onChange={(e) => setFormData({ ...formData, probability: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label>Close Date</label>
                <input
                  type="date"
                  value={formData.closeDate}
                  onChange={(e) => setFormData({ ...formData, closeDate: e.target.value })}
                />
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label>Link to Contact</label>
                  <select
                    value={formData.contactId}
                    onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                  >
                    <option value="">None</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Link to Lead</label>
                  <select
                    value={formData.leadId}
                    onChange={(e) => setFormData({ ...formData, leadId: e.target.value })}
                  >
                    <option value="">None</option>
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
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
                {saving ? 'Saving...' : 'Save Deal'}
              </button>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

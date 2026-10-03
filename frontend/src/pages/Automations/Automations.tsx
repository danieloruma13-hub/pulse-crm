import { useEffect, useState } from "react";
import { Plus, Trash2, X, Zap, CheckSquare, Bell } from "lucide-react";
import AppLayout from "../../components/Layout/AppLayout";
import api from "../../lib/api";
import styles from "./Automations.module.css";

const LEAD_STAGES = ["inbox","discovery","proposal","negotiation","won","lost"];
const DEAL_STAGES = ["prospecting","qualification","proposal","negotiation","won","lost"];

const TRIGGER_LABELS = {
  lead_stage_changed: "When a lead's stage changes to...",
  deal_stage_changed: "When a deal's stage changes to...",
};

const ACTION_LABELS = {
  create_task: "Create a follow-up task",
  create_notification: "Send a notification",
};

const emptyForm = { name: "", triggerType: "lead_stage_changed", triggerStage: "won", actionType: "create_task", actionTitle: "", priority: "medium" };

function timeAgo(isoString) {
  if (!isoString) return "Never";
  const diffMs = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return minutes + "m ago";
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + "h ago";
  const days = Math.floor(hours / 24);
  return days + "d ago";
}

export default function Automations() {
  const [automations, setAutomations] = useState(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  function loadAutomations() {
    api.get("/automations")
      .then(({ data }) => { setAutomations(data.automations); setError(""); })
      .catch((err) => setError(err.response?.data?.message || "Could not load automations"));
  }

  useEffect(() => { loadAutomations(); }, []);

  const stageOptions = formData.triggerType === "lead_stage_changed" ? LEAD_STAGES : DEAL_STAGES;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const actionConfig = {};
      if (formData.actionTitle) actionConfig.title = formData.actionTitle;
      if (formData.actionType === "create_task") actionConfig.priority = formData.priority;

      await api.post("/automations", {
        name: formData.name,
        triggerType: formData.triggerType,
        triggerStage: formData.triggerStage,
        actionType: formData.actionType,
        actionConfig,
      });
      setFormData(emptyForm);
      setShowForm(false);
      loadAutomations();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create automation");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(automation) {
    setTogglingId(automation.id);
    try {
      await api.patch("/automations/" + automation.id, { enabled: !automation.enabled });
      loadAutomations();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update automation");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await api.delete("/automations/" + id);
      loadAutomations();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete automation");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AppLayout
      title="Automations"
      subtitle="Let Pulse CRM take action automatically when things change"
      actions={
        <button className={styles.addBtn} onClick={() => setShowForm(true)}>
          <Plus size={16} /> New Automation
        </button>
      }
    >
      {error && <div className={styles.error}>{error}</div>}

      {automations === null ? (
        <div className={styles.empty}>Loading automations...</div>
      ) : automations.length === 0 ? (
        <div className={styles.empty}>No automations yet. Create one to have Pulse CRM react automatically to changes in your pipeline.</div>
      ) : (
        <div className={styles.list}>
          {automations.map((a) => (
            <div key={a.id} className={styles.card + " " + (a.enabled ? "" : styles.cardDisabled)}>
              <div className={styles.cardIcon}>
                {a.actionType === "create_task" ? <CheckSquare size={18} /> : <Bell size={18} />}
              </div>

              <div className={styles.cardBody}>
                <div className={styles.cardTitle}>{a.name}</div>
                <div className={styles.cardRule}>
                  {TRIGGER_LABELS[a.triggerType]} <strong>{a.triggerStage}</strong> {'\u2192'} {ACTION_LABELS[a.actionType]}
                </div>
                <div className={styles.cardMeta}>
                  Ran {a.runCount || 0} time{a.runCount === 1 ? "" : "s"} {'\u00b7'} Last: {timeAgo(a.lastRunAt)}
                </div>
              </div>

              <div className={styles.cardActions}>
                <button
                  className={styles.toggleBtn + " " + (a.enabled ? styles.toggleOn : "")}
                  onClick={() => handleToggle(a)}
                  disabled={togglingId === a.id}
                >
                  <span className={styles.toggleThumb} />
                </button>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(a.id)}
                  disabled={deletingId === a.id}
                  aria-label="Delete automation"
                >
                  <Trash2 size={15} />
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
              <h2><Zap size={18} /> New Automation</h2>
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
                  placeholder="e.g. Follow up on won deals"
                  required
                />
              </div>

              <div className={styles.field}>
                <label>Trigger</label>
                <select
                  value={formData.triggerType}
                  onChange={(e) => setFormData({ ...formData, triggerType: e.target.value, triggerStage: e.target.value === "lead_stage_changed" ? LEAD_STAGES[0] : DEAL_STAGES[0] })}
                >
                  <option value="lead_stage_changed">Lead stage changes</option>
                  <option value="deal_stage_changed">Deal stage changes</option>
                </select>
              </div>

              <div className={styles.field}>
                <label>To stage</label>
                <select
                  value={formData.triggerStage}
                  onChange={(e) => setFormData({ ...formData, triggerStage: e.target.value })}
                >
                  {stageOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label>Then</label>
                <select
                  value={formData.actionType}
                  onChange={(e) => setFormData({ ...formData, actionType: e.target.value })}
                >
                  <option value="create_task">Create a follow-up task</option>
                  <option value="create_notification">Send a notification</option>
                </select>
              </div>

              <div className={styles.field}>
                <label>Custom title (optional)</label>
                <input
                  type="text"
                  value={formData.actionTitle}
                  onChange={(e) => setFormData({ ...formData, actionTitle: e.target.value })}
                  placeholder="Leave blank to auto-generate"
                />
              </div>

              {formData.actionType === "create_task" && (
                <div className={styles.field}>
                  <label>Task priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              )}

              <button type="submit" className={styles.submitBtn} disabled={saving}>
                {saving ? "Saving..." : "Create Automation"}
              </button>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

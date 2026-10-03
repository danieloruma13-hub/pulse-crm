import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, X, CheckCircle2, Circle, Clock } from "lucide-react";
import AppLayout from "../../components/Layout/AppLayout";
import api from "../../lib/api";
import styles from "./Tasks.module.css";

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'];
const emptyForm = { title: '', description: '', dueDate: '', priority: 'medium' };

function isOverdue(task) {
  return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed' && task.status !== 'cancelled';
}

export default function Tasks() {
  const [tasks, setTasks] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const loadTasks = useCallback((status = '') => {
    const qs = status ? `?status=${status}` : '';
    api.get(`/tasks${qs}`)
      .then(({ data }) => { setTasks(data.data); setError(''); })
      .catch((err) => setError(err.response?.data?.message || 'Could not load tasks'));
  }, []);

  useEffect(() => {
    loadTasks(statusFilter);
  }, [statusFilter, loadTasks]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.title.trim()) return;
    setSaving(true);
    setError('');
    try {
      const payload = { ...formData };
      if (!payload.dueDate) delete payload.dueDate;
      await api.post('/tasks', payload);
      setFormData(emptyForm);
      setShowForm(false);
      loadTasks(statusFilter);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create task');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleComplete(task) {
    setTogglingId(task.id);
    try {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      await api.patch(`/tasks/${task.id}`, { status: newStatus });
      loadTasks(statusFilter);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update task');
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await api.delete(`/tasks/${id}`);
      loadTasks(statusFilter);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete task');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AppLayout
      title="Tasks"
      subtitle="Everything you need to follow up on"
      actions={
        <button className={styles.addBtn} onClick={() => setShowForm(true)}>
          <Plus size={16} /> Add Task
        </button>
      }
    >
      <div className={styles.filterRow}>
        <button className={`${styles.filterChip} ${statusFilter === '' ? styles.filterChipActive : ''}`} onClick={() => setStatusFilter('')}>
          All
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            className={`${styles.filterChip} ${statusFilter === s ? styles.filterChipActive : ''}`}
            onClick={() => setStatusFilter(s)}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {tasks === null ? (
        <div className={styles.empty}>Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className={styles.empty}>
          {statusFilter ? `No ${statusFilter.replace('_', ' ')} tasks.` : 'No tasks yet. Add your first one to get started.'}
        </div>
      ) : (
        <div className={styles.list}>
          {tasks.map((task) => (
            <div key={task.id} className={`${styles.item} ${task.status === 'completed' ? styles.itemDone : ''}`}>
              <button
                className={styles.checkbox}
                onClick={() => handleToggleComplete(task)}
                disabled={togglingId === task.id}
                aria-label="Toggle complete"
              >
                {task.status === 'completed' ? <CheckCircle2 size={20} /> : <Circle size={20} />}
              </button>

              <div className={styles.itemBody}>
                <div className={styles.itemTitle}>{task.title}</div>
                {task.description && <p className={styles.itemDesc}>{task.description}</p>}
                <div className={styles.itemMeta}>
                  <span className={`${styles.priorityBadge} ${styles['priority_' + task.priority]}`}>{task.priority}</span>
                  {task.dueDate && (
                    <span className={`${styles.dueDate} ${isOverdue(task) ? styles.overdue : ''}`}>
                      <Clock size={12} /> {new Date(task.dueDate).toLocaleDateString()}
                      {isOverdue(task) && ' (overdue)'}
                    </span>
                  )}
                </div>
              </div>

              <button
                className={styles.deleteBtn}
                onClick={() => handleDelete(task.id)}
                disabled={deletingId === task.id}
                aria-label="Delete task"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className={styles.modalOverlay} onClick={() => setShowForm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Add Task</h2>
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
              <div className={styles.field}>
                <label>Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label>Due date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
                <div className={styles.field}>
                  <label>Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button type="submit" className={styles.submitBtn} disabled={saving}>
                {saving ? 'Saving...' : 'Save Task'}
              </button>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

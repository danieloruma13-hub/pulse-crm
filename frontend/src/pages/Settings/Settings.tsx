import { useEffect, useState } from "react";
import { Save, RotateCcw, User, Bell, Palette } from "lucide-react";
import AppLayout from "../../components/Layout/AppLayout";
import api from "../../lib/api";
import { getCurrentUser, saveSession } from "../../lib/auth";
import styles from "./Settings.module.css";

const THEMES = ['dark', 'light', 'system'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'NGN', 'GHS', 'ZAR'];
const NOTIFICATION_LABELS = {
  email: 'Email notifications',
  push: 'Push notifications',
  taskReminders: 'Task reminders',
  dealUpdates: 'Deal updates',
  weeklyDigest: 'Weekly digest',
};

export default function Settings() {
  const user = getCurrentUser();
  const [settings, setSettings] = useState(null);
  const [name, setName] = useState(user?.name || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    api.get('/settings')
      .then(({ data }) => setSettings(data.settings))
      .catch((err) => setError(err.response?.data?.message || 'Could not load settings'));
  }, []);

  function flashSuccess(msg) {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 2500);
  }

  async function handleSaveSettings() {
    setSaving(true);
    setError('');
    try {
      const { data } = await api.patch('/settings', settings);
      setSettings(data.settings);
      flashSuccess('Settings saved');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save settings');
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    setSaving(true);
    setError('');
    try {
      const { data } = await api.post('/settings/reset');
      setSettings(data.settings);
      flashSuccess('Settings reset to defaults');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reset settings');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSavingProfile(true);
    setError('');
    try {
      const { data } = await api.patch('/auth/profile', { name });
      const refreshToken = localStorage.getItem('refreshToken');
      const accessToken = localStorage.getItem('accessToken');
      saveSession(accessToken, refreshToken, data.user);
      flashSuccess('Profile updated');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update profile');
    } finally {
      setSavingProfile(false);
    }
  }

  function toggleNotification(key) {
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: !prev.notifications[key] },
    }));
  }

  if (!settings) {
    return (
      <AppLayout title="Settings" subtitle="Manage your account and preferences">
        <div className={styles.empty}>Loading settings...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Settings" subtitle="Manage your account and preferences">
      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <User size={17} />
          <h2>Profile</h2>
        </div>
        <form onSubmit={handleSaveProfile} className={styles.sectionBody}>
          <div className={styles.field}>
            <label>Full name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Email</label>
            <input type="email" value={user?.email || ''} disabled />
          </div>
          <button type="submit" className={styles.saveBtn} disabled={savingProfile}>
            <Save size={15} /> {savingProfile ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Palette size={17} />
          <h2>Preferences</h2>
        </div>
        <div className={styles.sectionBody}>
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label>Theme</label>
              <select value={settings.theme} onChange={(e) => setSettings({ ...settings, theme: e.target.value })}>
                {THEMES.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label>Default Currency</label>
              <select value={settings.defaultCurrency} onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.field}>
            <label>Timezone</label>
            <input
              type="text"
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              placeholder="e.g. Africa/Accra"
            />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Bell size={17} />
          <h2>Notifications</h2>
        </div>
        <div className={styles.sectionBody}>
          {Object.entries(NOTIFICATION_LABELS).map(([key, label]) => (
            <label key={key} className={styles.toggleRow}>
              <span>{label}</span>
              <input
                type="checkbox"
                checked={settings.notifications[key]}
                onChange={() => toggleNotification(key)}
              />
              <span className={styles.toggleTrack} data-checked={settings.notifications[key]}>
                <span className={styles.toggleThumb} />
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className={styles.actionsRow}>
        <button className={styles.resetBtn} onClick={handleReset} disabled={saving}>
          <RotateCcw size={15} /> Reset to defaults
        </button>
        <button className={styles.saveBtn} onClick={handleSaveSettings} disabled={saving}>
          <Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </AppLayout>
  );
}

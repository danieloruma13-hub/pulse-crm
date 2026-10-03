import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  Search,
  Sparkles,
  Bell,
  Settings,
  ChevronDown,
  Check,
} from "lucide-react";

import api from "../../../lib/api";
import styles from "./Topbar.module.css";

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return minutes + "m ago";
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + "h ago";
  const days = Math.floor(hours / 24);
  return days + "d ago";
}

export default function Topbar({ onMenuClick }) {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/notifications?limit=5")
      .then(({ data }) => setUnreadCount(data.unreadCount || 0))
      .catch(() => {});
  }, []);

  function toggleNotifications() {
    const next = !showNotifications;
    setShowNotifications(next);
    if (next) {
      setError("");
      api.get("/notifications?limit=10")
        .then(({ data }) => { setNotifications(data.data); setUnreadCount(data.unreadCount || 0); })
        .catch((err) => setError(err.response?.data?.message || "Could not load notifications"));
    }
  }

  async function handleMarkAllRead() {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => (prev || []).map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      setError(err.response?.data?.message || "Could not update notifications");
    }
  }

  return (
    <header className={styles.topbar}>

      <button
        className={styles.menuButton}
        onClick={onMenuClick}
        aria-label="Open sidebar"
      >
        <Menu size={21} />
      </button>

      <div className={styles.search}>
        <Search size={17} />

        <input
          type="text"
          placeholder="Search anything..."
          aria-label="Search"
        />

        <span className={styles.shortcut}>
          \u2318 K
        </span>
      </div>

      <div className={styles.actions}>

        <button className={styles.aiButton} onClick={() => navigate("/ai-assistant")}>
          <Sparkles size={17} />
          <span>AI Assistant</span>
        </button>

        <div className={styles.notifWrap}>
          <button
            className={styles.iconButton}
            aria-label="Notifications"
            onClick={toggleNotifications}
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className={styles.notificationBadge}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <button className={styles.notifBackdrop} onClick={() => setShowNotifications(false)} aria-label="Close" />
              <div className={styles.notifPanel}>
                <div className={styles.notifHeader}>
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <button className={styles.markAllBtn} onClick={handleMarkAllRead}>
                      <Check size={12} /> Mark all read
                    </button>
                  )}
                </div>

                {error && <div className={styles.notifError}>{error}</div>}

                <div className={styles.notifList}>
                  {notifications === null ? (
                    <div className={styles.notifEmpty}>Loading...</div>
                  ) : notifications.length === 0 ? (
                    <div className={styles.notifEmpty}>No notifications yet.</div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className={styles.notifItem + " " + (n.read ? "" : styles.notifUnread)}>
                        <div className={styles.notifTitle}>{n.title}</div>
                        <div className={styles.notifMessage}>{n.message}</div>
                        <div className={styles.notifTime}>{timeAgo(n.createdAt)}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <button
          className={styles.iconButton}
          aria-label="Settings"
          onClick={() => navigate("/settings")}
        >
          <Settings size={19} />
        </button>

        <button className={styles.profileButton} onClick={() => navigate("/settings")}>
          <div className={styles.avatar}>
            D
          </div>

          <ChevronDown size={15} />
        </button>

      </div>
    </header>
  );
}

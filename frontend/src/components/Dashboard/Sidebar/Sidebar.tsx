import {
  LayoutDashboard,
  Sparkles,
  Users,
  UserRoundPlus,
  MessageSquare,
  Mail,
  Share2,
  GitBranch,
  CheckSquare,
  CalendarDays,
  BarChart3,
  Zap,
  FileText,
  Plug,
  Settings as SettingsIcon,
  HelpCircle,
  Menu,
  X,
  LogOut,
  ChevronDown,
} from "lucide-react";

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./Sidebar.module.css";

const navigation = [
  {
    section: "MAIN",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
      { label: "AI Assistant", icon: Sparkles, path: "/ai-assistant" },
      { label: "Contacts", icon: Users, path: "/contacts" },
      { label: "Leads", icon: UserRoundPlus, path: "/leads" },
      { label: "Conversations", icon: MessageSquare, path: "/conversations" },
    ],
  },

  {
    section: "ENGAGEMENT",
    items: [
      { label: "Email Campaigns", icon: Mail, path: "/email-campaigns" },
      { label: "Social Media", icon: Share2, path: "/social-media" },
      { label: "Sales Pipeline", icon: GitBranch, path: "/pipeline" },
      { label: "Tasks", icon: CheckSquare, path: "/tasks" },
      { label: "Calendar", icon: CalendarDays, path: "/calendar" },
    ],
  },

  {
    section: "INSIGHTS",
    items: [
      { label: "Analytics", icon: BarChart3, path: "/analytics" },
      { label: "Automations", icon: Zap, path: "/automations" },
      { label: "Reports", icon: FileText, path: "/reports" },
      { label: "Integrations", icon: Plug, path: "/integrations" },
    ],
  },

  {
    section: "SYSTEM",
    items: [
      { label: "Settings", icon: SettingsIcon, path: "/settings" },
    ],
  },
];

export default function Sidebar({ user, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  function closeMobileSidebar() {
    setMobileOpen(false);
  }

  function handleNavClick(item) {
    closeMobileSidebar();
    if (item.path) {
      navigate(item.path);
    }
  }

  return (
    <>
      <button
        className={styles.mobileMenu}
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
      >
        <Menu size={22} />
      </button>

      {mobileOpen && (
        <button
          className={styles.overlay}
          onClick={closeMobileSidebar}
          aria-label="Close navigation"
        />
      )}

      <aside
        className={`${styles.sidebar} ${
          mobileOpen ? styles.sidebarOpen : ""
        }`}
      >
        <div className={styles.logoArea}>
          <div className={styles.logoIcon}>
            <Sparkles size={19} />
          </div>

          <span>Pulse CRM</span>

          <button
            className={styles.closeButton}
            onClick={closeMobileSidebar}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <nav className={styles.navigation}>
          {navigation.map((group) => (
            <div
              className={styles.navGroup}
              key={group.section}
            >
              <div className={styles.sectionTitle}>
                {group.section}
              </div>

              <div className={styles.navItems}>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = item.path === location.pathname;
                  const disabled = !item.path;

                  return (
                    <button
                      key={item.label}
                      className={`${styles.navItem} ${active ? styles.active : ""}`}
                      onClick={() => handleNavClick(item)}
                      style={disabled ? { opacity: 0.45, cursor: 'default' } : undefined}
                      title={disabled ? 'Coming soon' : undefined}
                    >
                      <Icon size={18} />

                      <span>{item.label}</span>

                      {item.badge && (
                        <span className={styles.badge}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className={styles.bottomArea}>
          <div className={styles.profile}>
            <div className={styles.avatar}>
              {user?.name
                ? user.name.charAt(0).toUpperCase()
                : "?"}
            </div>

            <div className={styles.profileInfo}>
              <strong>
                {user?.name || "Guest"}
              </strong>

              <span>{user?.role === 'user' ? 'Member' : (user?.role || 'Member')}</span>
            </div>

            <ChevronDown size={16} />
          </div>

          <button className={styles.helpButton}>
            <HelpCircle size={18} />
            <span>Help & Support</span>
          </button>

          <button
            className={styles.logoutButton}
            onClick={onLogout}
          >
            <LogOut size={18} />
            <span>Log out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

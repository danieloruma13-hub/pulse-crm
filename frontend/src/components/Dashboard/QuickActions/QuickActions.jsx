import {
  Plus,
  UserPlus,
  CalendarPlus,
  CheckSquare,
  Mail,
} from "lucide-react";

import styles from "./QuickActions.module.css";

const actions = [
  {
    icon: UserPlus,
    title: "Add Lead",
    description: "Create a new lead",
  },
  {
    icon: CalendarPlus,
    title: "Schedule Meeting",
    description: "Book a meeting",
  },
  {
    icon: CheckSquare,
    title: "Create Task",
    description: "Add a new task",
  },
  {
    icon: Mail,
    title: "Send Campaign",
    description: "Start an email campaign",
  },
];

export default function QuickActions() {
  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <div>
          <h2>Quick Actions</h2>
          <p>Get things done faster</p>
        </div>

        <div className={styles.headerIcon}>
          <Plus size={18} />
        </div>
      </div>

      <div className={styles.actions}>
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.title}
              className={styles.action}
            >
              <div className={styles.icon}>
                <Icon size={18} />
              </div>

              <div className={styles.actionText}>
                <strong>{action.title}</strong>
                <span>{action.description}</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
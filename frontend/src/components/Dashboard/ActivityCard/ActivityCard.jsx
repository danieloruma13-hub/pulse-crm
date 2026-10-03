import {
  UserPlus,
  MessageSquare,
  Trophy,
  CalendarCheck,
  Bell,
} from "lucide-react";

import styles from "./ActivityCard.module.css";

const ICON_MAP = {
  task_created: UserPlus,
  task_completed: Trophy,
  event_created: CalendarCheck,
  default: Bell,
};

function timeAgo(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

export default function ActivityCard({ activity }) {
  const list = activity || [];

  return (

    <section className={styles.card}>

      <div className={styles.header}>

        <div>

          <h2>Recent Activity</h2>

          <p>Latest CRM updates</p>

        </div>

      </div>

      <div className={styles.timeline}>

        {activity !== undefined && list.length === 0 && (
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            No recent activity yet.
          </span>
        )}

        {list.map((item) => {

          const Icon = ICON_MAP[item.type] || ICON_MAP.default;

          return (

            <div
              className={styles.activity}
              key={item.id}
            >

              <div className={styles.icon}>
                <Icon size={18}/>
              </div>

              <div className={styles.content}>

                <h4>{item.title}</h4>

                <p>{item.message}</p>

                <span>{timeAgo(item.createdAt)}</span>

              </div>

            </div>

          );

        })}

      </div>

    </section>

  );

}

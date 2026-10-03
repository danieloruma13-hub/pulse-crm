import { CheckCircle2, Circle, Plus } from "lucide-react";
import styles from "./TasksCard.module.css";

export default function TasksCard({ tasks }) {
  const list = tasks || [];

  return (
    <section className={styles.card}>

      <div className={styles.header}>

        <div>

          <h2>Today's Tasks</h2>

          <p>{tasks === undefined ? 'Loading...' : `${list.length} Task${list.length === 1 ? '' : 's'} Remaining`}</p>

        </div>

        <button className={styles.addButton}>

          <Plus size={18} />

        </button>

      </div>

      <div className={styles.tasks}>

        {tasks !== undefined && list.length === 0 && (
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            No pending tasks. You're all caught up.
          </span>
        )}

        {list.map((task) => (

          <div
            key={task.id}
            className={styles.task}
          >

            <div className={styles.checkbox}>
              <Circle size={20} />
            </div>

            <span>
              {task.title}
            </span>

          </div>

        ))}

      </div>

    </section>
  );
}

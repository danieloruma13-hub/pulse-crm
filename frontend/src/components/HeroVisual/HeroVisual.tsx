import { Users, Calendar, Bell } from 'lucide-react';
import styles from './HeroVisual.module.css';

export default function HeroVisual() {
  return (
    <div className={styles.stage}>
      <img src="/hero-office.png" alt="Pulse CRM dashboard on a laptop" className={styles.photo} />

      <div className={`${styles.chip} ${styles.chipTopRight}`}>
        <Users size={16} />
        <div>
          <div className={styles.chipValue}>12,540</div>
          <div className={styles.chipLabel}>Total Leads</div>
        </div>
      </div>

      <div className={`${styles.chip} ${styles.chipBottomLeft}`}>
        <Calendar size={16} />
        <div>
          <div className={styles.chipValue}>3</div>
          <div className={styles.chipLabel}>Meetings Today</div>
        </div>
      </div>

      <div className={`${styles.chip} ${styles.chipBottomRight}`}>
        <Bell size={16} />
        <div>
          <div className={styles.chipValue}>5</div>
          <div className={styles.chipLabel}>AI Insights</div>
        </div>
      </div>
    </div>
  );
}

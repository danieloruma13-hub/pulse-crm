import {
  TrendingUp,
  Users,
  Calendar,
  Bell,
} from "lucide-react";

import styles from "./DashboardPreview.module.css";

export default function DashboardPreview() {
  return (
    <div className={styles.preview}>

      <div className={styles.window}>

        <div className={styles.windowHeader}>
          <span></span>
          <span></span>
          <span></span>
        </div>

        <div className={styles.stats}>

          <div className={styles.statCard}>
            <Users size={18} />
            <div>
              <strong>12,540</strong>
              <small>Total Leads</small>
            </div>
          </div>

          <div className={styles.statCard}>
            <TrendingUp size={18} />
            <div>
              <strong>$68.5K</strong>
              <small>Revenue</small>
            </div>
          </div>

          <div className={styles.statCard}>
            <Calendar size={18} />
            <div>
              <strong>3</strong>
              <small>Meetings</small>
            </div>
          </div>

          <div className={styles.statCard}>
            <Bell size={18} />
            <div>
              <strong>5</strong>
              <small>AI Insights</small>
            </div>
          </div>

        </div>

        <div className={styles.chart}>

          <svg viewBox="0 0 600 220">

            <defs>

              <linearGradient
                id="previewGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#7c6cff" />
                <stop offset="100%" stopColor="#4db0ff" />
              </linearGradient>

            </defs>

            <path
              d="
                M20 180
                C70 150 110 160 150 120
                S240 60 300 90
                S380 150 430 110
                S520 40 580 60
              "
              fill="none"
              stroke="url(#previewGradient)"
              strokeWidth="5"
              strokeLinecap="round"
            />

          </svg>

        </div>

      </div>

    </div>
  );
}
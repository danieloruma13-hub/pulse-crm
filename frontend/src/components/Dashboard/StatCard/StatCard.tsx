import { TrendingUp } from "lucide-react";
import styles from "./StatCard.module.css";

type StatCardProps = {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
};

export default function StatCard({
  title,
  value,
  change,
  icon,
}: StatCardProps) {
  return (
    <div className={styles.card}>

      <div className={styles.header}>

        <div>
          <p className={styles.title}>{title}</p>
          <h2 className={styles.value}>{value}</h2>
        </div>

        <div className={styles.icon}>
          {icon}
        </div>

      </div>

      <div className={styles.footer}>

        <TrendingUp size={14} />

        <span>{change}</span>

      </div>

    </div>
  );
}
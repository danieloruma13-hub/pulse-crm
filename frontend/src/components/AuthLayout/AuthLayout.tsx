import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import styles from './AuthLayout.module.css';

export default function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className={styles.wrap}>
      <img src="/hero-office.png" alt="" className={styles.bg} />
      <div className={styles.overlay} />

      <div className={styles.card}>
        <Link to="/" className={styles.logo}>
          <div className={styles.logoIcon}>
            <Sparkles size={18} />
          </div>
          <span>Pulse CRM</span>
        </Link>

        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>

        {children}
      </div>
    </main>
  );
}

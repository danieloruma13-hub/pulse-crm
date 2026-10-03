import {
  Sparkles,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";

import styles from "./HeroBanner.module.css";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function HeroBanner({ user, stats }) {
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <section className={styles.banner}>
      <div className={styles.glow} />
      <div className={styles.glowTwo} />

      <div className={styles.content}>
        <div className={styles.badge}>
          <Sparkles size={14} />
          AI-powered CRM
        </div>

        <h1>
          {getGreeting()}, {firstName}
          <span> 👋</span>
        </h1>

        <p>
          {stats === undefined
            ? "Loading your latest business snapshot..."
            : "Here's what's happening with your business today."}
        </p>

        {stats && (
          <div className={styles.insight}>
            <div className={styles.insightIcon}>
              <TrendingUp size={17} />
            </div>

            <div>
              {stats.totalLeads === 0 ? (
                <>
                  <strong>Add your first lead to get started</strong>
                  <span>Your pipeline is empty right now</span>
                </>
              ) : (
                <>
                  <strong>
                    {stats.totalLeads} lead{stats.totalLeads === 1 ? '' : 's'} · {stats.openDeals} open deal{stats.openDeals === 1 ? '' : 's'}
                  </strong>
                  <span>
                    {stats.revenue > 0 ? `$${stats.revenue.toLocaleString()} in closed revenue` : 'No closed revenue yet'}
                  </span>
                </>
              )}
            </div>

            <ArrowUpRight
              size={17}
              className={styles.arrow}
            />
          </div>
        )}
      </div>

      <div className={styles.aiOrb}>
        <div className={styles.orbInner}>
          <Sparkles size={30} />
        </div>
      </div>
    </section>
  );
}

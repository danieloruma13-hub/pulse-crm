import {
  Users,
  MoreHorizontal,
} from "lucide-react";

import styles from "./SalesPipeline.module.css";

const STAGE_LABELS = {
  inbox: "New Lead",
  discovery: "Discovery",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Closed Won",
  lost: "Lost",
};

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value || 0);
}

export default function SalesPipeline({ pipeline }) {
  const stages = (pipeline || []).map((p) => ({
    title: STAGE_LABELS[p.stage] || p.stage,
    count: `${p.leadCount} lead${p.leadCount === 1 ? '' : 's'}`,
    value: formatCurrency(p.value),
  }));

  const hasData = stages.length > 0 && stages.some((s) => s.count !== '0 leads');

  return (
    <section className={styles.card}>

      <div className={styles.header}>
        <div>
          <h2>Sales Pipeline</h2>
          <p>Track your deals through every stage.</p>
        </div>

        <button className={styles.filter}>
          This Month
          <span>⌄</span>
        </button>
      </div>

      {!pipeline ? (
        <div className={styles.pipeline}>
          <span style={{ color: 'var(--text-secondary)', padding: '24px 0' }}>Loading pipeline...</span>
        </div>
      ) : !hasData ? (
        <div className={styles.pipeline}>
          <span style={{ color: 'var(--text-secondary)', padding: '24px 0' }}>
            No leads yet — add your first lead to see your pipeline here.
          </span>
        </div>
      ) : (
        <div className={styles.pipeline}>
          {stages.map((stage) => (
            <div
              key={stage.title}
              className={styles.stage}
            >

              <div className={styles.stageLine} />

              <h3>{stage.title}</h3>

              <span className={styles.count}>
                {stage.count}
              </span>

              <strong>{stage.value}</strong>

            </div>
          ))}
        </div>
      )}

      <button className={styles.moreButton}>
        <Users size={15} />
        View all deals
        <MoreHorizontal size={16} />
      </button>

    </section>
  );
}

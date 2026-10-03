import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, MoreHorizontal } from "lucide-react";
import api from "../../../lib/api";
import styles from "./RevenueChart.module.css";

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value || 0);
}

function buildPath(points, width, height, padding) {
  const values = points.map((p) => p.revenue);
  const max = Math.max(...values, 1);
  const min = 0;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

  const coords = points.map((p, i) => {
    const x = padding + (i / (points.length - 1)) * usableWidth;
    const ratio = (p.revenue - min) / (max - min || 1);
    const y = padding + usableHeight - ratio * usableHeight;
    return { x, y };
  });

  const linePath = coords.map((c, i) => (i === 0 ? `M${c.x} ${c.y}` : `L${c.x} ${c.y}`)).join(' ');
  const fillPath = `${linePath} L${coords[coords.length - 1].x} ${height - padding} L${coords[0].x} ${height - padding} Z`;

  return { linePath, fillPath };
}

export default function RevenueChart() {
  const [trend, setTrend] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.get('/analytics/revenue-trend?months=7')
      .then(({ data }) => { if (!cancelled) setTrend(data.trend); })
      .catch((err) => { if (!cancelled) setError(err.response?.data?.message || 'Could not load revenue trend'); });
    return () => { cancelled = true; };
  }, []);

  const currentTotal = trend?.[trend.length - 1]?.revenue ?? 0;
  const previousTotal = trend?.[trend.length - 2]?.revenue ?? 0;
  const change = previousTotal > 0 ? (((currentTotal - previousTotal) / previousTotal) * 100).toFixed(1) : null;

  const { linePath, fillPath } = trend ? buildPath(trend, 700, 280, 40) : { linePath: '', fillPath: '' };

  return (
    <section className={styles.card}>

      <div className={styles.header}>

        <div>

          <h2>Revenue Overview</h2>

          <p>Monthly revenue performance</p>

        </div>

        <button className={styles.more}>

          <MoreHorizontal size={20} />

        </button>

      </div>

      <div className={styles.total}>

        <h1>{trend ? formatCurrency(currentTotal) : '...'}</h1>

        {change !== null && (
          <span style={{ color: Number(change) >= 0 ? undefined : '#f87171' }}>
            {Number(change) >= 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
            {change}%
          </span>
        )}

      </div>

      <div className={styles.chart}>

        {error && <div style={{ color: '#fca5a5', fontSize: '0.85rem' }}>{error}</div>}

        {trend && (
          <svg
            viewBox="0 0 700 280"
            preserveAspectRatio="none"
          >

            <defs>

              <linearGradient
                id="lineGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >

                <stop offset="0%" stopColor="#7c6cff"/>

                <stop offset="100%" stopColor="#4db0ff"/>

              </linearGradient>

              <linearGradient
                id="fillGradient"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >

                <stop
                  offset="0%"
                  stopColor="#6b5cff"
                  stopOpacity=".35"
                />

                <stop
                  offset="100%"
                  stopColor="#6b5cff"
                  stopOpacity="0"
                />

              </linearGradient>

            </defs>

            <path
              d={linePath}
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="6"
              strokeLinecap="round"
            />

            <path
              d={fillPath}
              fill="url(#fillGradient)"
            />

          </svg>
        )}

      </div>

      <div className={styles.months}>
        {trend?.map((point) => (
          <span key={point.month}>
            {new Date(point.month + '-01').toLocaleDateString('en-US', { month: 'short' })}
          </span>
        ))}
      </div>

    </section>
  );
}

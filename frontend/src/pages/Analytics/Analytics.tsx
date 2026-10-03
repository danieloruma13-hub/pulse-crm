import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Users, DollarSign, Percent, CheckSquare } from "lucide-react";
import AppLayout from "../../components/Layout/AppLayout";
import api from "../../lib/api";
import styles from "./Analytics.module.css";

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value || 0);
}

function monthLabel(monthStr) {
  return new Date(monthStr + '-01').toLocaleDateString('en-US', { month: 'short' });
}

function LineChart({ data, valueKey, color = '#6366f1' }) {
  if (!data || data.length === 0) return null;
  const width = 600, height = 200, padding = 30;
  const values = data.map((d) => d[valueKey]);
  const max = Math.max(...values, 1);
  const usableW = width - padding * 2;
  const usableH = height - padding * 2;

  const coords = data.map((d, i) => ({
    x: padding + (i / (data.length - 1 || 1)) * usableW,
    y: padding + usableH - (d[valueKey] / max) * usableH,
  }));

  const linePath = coords.map((c, i) => (i === 0 ? `M${c.x} ${c.y}` : `L${c.x} ${c.y}`)).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={styles.chartSvg} preserveAspectRatio="none">
      <path d={linePath} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r="3" fill={color} />
      ))}
    </svg>
  );
}

function BarChart({ data, keys, colors, height = 200 }) {
  if (!data || data.length === 0) return null;
  const width = 600, padding = 30;
  const allValues = data.flatMap((d) => keys.map((k) => d[k]));
  const max = Math.max(...allValues, 1);
  const usableW = width - padding * 2;
  const usableH = height - padding * 2;
  const groupWidth = usableW / data.length;
  const barWidth = (groupWidth * 0.6) / keys.length;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={styles.chartSvg} preserveAspectRatio="none">
      {data.map((d, i) => {
        const groupX = padding + i * groupWidth + groupWidth * 0.2;
        return keys.map((k, ki) => {
          const barH = (d[k] / max) * usableH;
          return (
            <rect
              key={k}
              x={groupX + ki * barWidth}
              y={padding + usableH - barH}
              width={barWidth * 0.85}
              height={barH}
              fill={colors[ki]}
              rx="2"
            />
          );
        });
      })}
    </svg>
  );
}

export default function Analytics() {
  const [overview, setOverview] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState(null);
  const [leadGrowth, setLeadGrowth] = useState(null);
  const [salesPerformance, setSalesPerformance] = useState(null);
  const [conversion, setConversion] = useState(null);
  const [taskCompletion, setTaskCompletion] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/analytics/overview'),
      api.get('/analytics/revenue-trend?months=6'),
      api.get('/analytics/lead-growth?months=6'),
      api.get('/analytics/sales-performance?months=6'),
      api.get('/analytics/conversion-rate'),
      api.get('/analytics/task-completion'),
    ])
      .then(([o, r, l, s, c, t]) => {
        setOverview(o.data.overview);
        setRevenueTrend(r.data.trend);
        setLeadGrowth(l.data.trend);
        setSalesPerformance(s.data.trend);
        setConversion(c.data.conversion);
        setTaskCompletion(t.data.taskCompletion);
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load analytics'));
  }, []);

  const loading = !overview;

  return (
    <AppLayout title="Analytics" subtitle="Real performance data from your pipeline">
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><Users size={18} /></div>
          <div>
            <div className={styles.statValue}>{loading ? '...' : overview.totalLeads}</div>
            <div className={styles.statLabel}>Total Leads</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><DollarSign size={18} /></div>
          <div>
            <div className={styles.statValue}>{loading ? '...' : formatCurrency(overview.revenue)}</div>
            <div className={styles.statLabel}>Total Revenue</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><Percent size={18} /></div>
          <div>
            <div className={styles.statValue}>{conversion ? `${conversion.conversionRate}%` : '...'}</div>
            <div className={styles.statLabel}>Conversion Rate</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><CheckSquare size={18} /></div>
          <div>
            <div className={styles.statValue}>{taskCompletion ? `${taskCompletion.completionRate}%` : '...'}</div>
            <div className={styles.statLabel}>Task Completion</div>
          </div>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3>Revenue Trend</h3>
            <span>Last 6 months</span>
          </div>
          {revenueTrend ? <LineChart data={revenueTrend} valueKey="revenue" color="#6366f1" /> : <div className={styles.chartLoading}>Loading...</div>}
          {revenueTrend && (
            <div className={styles.axisLabels}>
              {revenueTrend.map((d) => <span key={d.month}>{monthLabel(d.month)}</span>)}
            </div>
          )}
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3>Lead Growth</h3>
            <span>New leads per month</span>
          </div>
          {leadGrowth ? <BarChart data={leadGrowth} keys={['newLeads']} colors={['#3b82f6']} /> : <div className={styles.chartLoading}>Loading...</div>}
          {leadGrowth && (
            <div className={styles.axisLabels}>
              {leadGrowth.map((d) => <span key={d.month}>{monthLabel(d.month)}</span>)}
            </div>
          )}
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3>Sales Performance</h3>
            <span>Won vs Lost deals</span>
          </div>
          {salesPerformance ? (
            <>
              <BarChart data={salesPerformance} keys={['won', 'lost']} colors={['#22c55e', '#ef4444']} />
              <div className={styles.legend}>
                <span className={styles.legendItem}><span className={styles.dotGreen} /> Won</span>
                <span className={styles.legendItem}><span className={styles.dotRed} /> Lost</span>
              </div>
            </>
          ) : <div className={styles.chartLoading}>Loading...</div>}
          {salesPerformance && (
            <div className={styles.axisLabels}>
              {salesPerformance.map((d) => <span key={d.month}>{monthLabel(d.month)}</span>)}
            </div>
          )}
        </div>

        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3>Conversion Funnel</h3>
            <span>Leads converted to customers</span>
          </div>
          {conversion ? (
            <div className={styles.funnelStat}>
              <div className={styles.funnelBig}>{conversion.convertedLeads} / {conversion.totalLeads}</div>
              <div className={styles.funnelSub}>leads converted ({conversion.conversionRate}%)</div>
            </div>
          ) : <div className={styles.chartLoading}>Loading...</div>}
        </div>
      </div>
    </AppLayout>
  );
}

import { useState } from "react";
import { Download, FileText, Printer, Users, UserRoundPlus, Briefcase, CheckSquare } from "lucide-react";
import AppLayout from "../../components/Layout/AppLayout";
import api from "../../lib/api";
import styles from "./Reports.module.css";

function toCSV(rows, columns) {
  const header = columns.map((c) => c.label).join(",");
  const lines = rows.map((row) =>
    columns.map((c) => {
      const val = row[c.key];
      const str = val === null || val === undefined ? "" : String(val);
      return "\"" + str.replace(/"/g, "\"\"") + "\"";
    }).join(",")
  );
  return [header, ...lines].join("\n");
}

function downloadCSV(filename, csvContent) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const EXPORTS = [
  {
    key: "contacts", label: "Contacts", icon: Users, endpoint: "/contacts?limit=1000",
    columns: [
      { key: "name", label: "Name" }, { key: "email", label: "Email" },
      { key: "phone", label: "Phone" }, { key: "company", label: "Company" },
      { key: "createdAt", label: "Created" },
    ],
  },
  {
    key: "leads", label: "Leads", icon: UserRoundPlus, endpoint: "/leads?limit=1000",
    columns: [
      { key: "name", label: "Name" }, { key: "company", label: "Company" },
      { key: "stage", label: "Stage" }, { key: "status", label: "Status" },
      { key: "score", label: "Score" }, { key: "source", label: "Source" },
      { key: "createdAt", label: "Created" },
    ],
  },
  {
    key: "deals", label: "Deals", icon: Briefcase, endpoint: "/deals?limit=1000",
    columns: [
      { key: "title", label: "Title" }, { key: "value", label: "Value" },
      { key: "currency", label: "Currency" }, { key: "stage", label: "Stage" },
      { key: "probability", label: "Probability" }, { key: "closeDate", label: "Close Date" },
      { key: "createdAt", label: "Created" },
    ],
  },
  {
    key: "tasks", label: "Tasks", icon: CheckSquare, endpoint: "/tasks?limit=1000",
    columns: [
      { key: "title", label: "Title" }, { key: "priority", label: "Priority" },
      { key: "status", label: "Status" }, { key: "dueDate", label: "Due Date" },
      { key: "createdAt", label: "Created" },
    ],
  },
];

export default function Reports() {
  const [exportingKey, setExportingKey] = useState(null);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  async function handleExport(item) {
    setExportingKey(item.key);
    setError("");
    try {
      const { data } = await api.get(item.endpoint);
      const rows = data.data || [];
      if (rows.length === 0) {
        setError("No " + item.label.toLowerCase() + " to export yet.");
        return;
      }
      const csv = toCSV(rows, item.columns);
      downloadCSV("pulse-crm-" + item.key + "-" + new Date().toISOString().slice(0, 10) + ".csv", csv);
    } catch (err) {
      setError(err.response?.data?.message || "Could not export " + item.label.toLowerCase());
    } finally {
      setExportingKey(null);
    }
  }

  async function handleGenerateSummary() {
    setSummaryLoading(true);
    setError("");
    try {
      const [overviewRes, recommendRes] = await Promise.all([
        api.get("/analytics/overview"),
        api.get("/ai/recommend-actions"),
      ]);
      setSummary({
        overview: overviewRes.data.overview,
        recommendations: recommendRes.data.recommendations,
        generatedAt: new Date().toLocaleString(),
      });
    } catch (err) {
      setError(err.response?.data?.message || "Could not generate summary report");
    } finally {
      setSummaryLoading(false);
    }
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value || 0);
  }

  return (
    <AppLayout title="Reports" subtitle="Export your data or generate a business summary">
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Data Exports</h2>
        <p className={styles.sectionSub}>Download your real CRM data as CSV, ready for Excel or Google Sheets.</p>

        <div className={styles.exportGrid}>
          {EXPORTS.map((item) => (
            <div key={item.key} className={styles.exportCard}>
              <div className={styles.exportIcon}>
                <item.icon size={20} />
              </div>
              <div className={styles.exportLabel}>{item.label}</div>
              <button
                className={styles.exportBtn}
                onClick={() => handleExport(item)}
                disabled={exportingKey === item.key}
              >
                <Download size={14} /> {exportingKey === item.key ? "Exporting..." : "Export CSV"}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.summaryHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Business Summary Report</h2>
            <p className={styles.sectionSub}>A real-time snapshot of your pipeline, with AI-generated next steps.</p>
          </div>
          {summary && (
            <button className={styles.printBtn} onClick={() => window.print()}>
              <Printer size={14} /> Print / Save PDF
            </button>
          )}
        </div>

        {!summary ? (
          <button className={styles.generateBtn} onClick={handleGenerateSummary} disabled={summaryLoading}>
            <FileText size={16} /> {summaryLoading ? "Generating..." : "Generate Report"}
          </button>
        ) : (
          <div className={styles.reportCard}>
            <div className={styles.reportHeader}>
              <h3>Pulse CRM \u2014 Business Summary</h3>
              <span>Generated {summary.generatedAt}</span>
            </div>

            <div className={styles.reportStats}>
              <div className={styles.reportStat}>
                <span>Total Leads</span>
                <strong>{summary.overview.totalLeads}</strong>
              </div>
              <div className={styles.reportStat}>
                <span>Open Deals</span>
                <strong>{summary.overview.openDeals}</strong>
              </div>
              <div className={styles.reportStat}>
                <span>Revenue (Won Deals)</span>
                <strong>{formatCurrency(summary.overview.revenue)}</strong>
              </div>
              <div className={styles.reportStat}>
                <span>Pending Tasks</span>
                <strong>{summary.overview.pendingTasks}</strong>
              </div>
              <div className={styles.reportStat}>
                <span>Overdue Tasks</span>
                <strong>{summary.overview.overdueTasks}</strong>
              </div>
            </div>

            <div className={styles.reportSection}>
              <h4>AI Recommended Next Actions</h4>
              <p className={styles.reportText}>{summary.recommendations}</p>
            </div>

            <button className={styles.generateBtn} onClick={handleGenerateSummary} disabled={summaryLoading}>
              <FileText size={16} /> {summaryLoading ? "Regenerating..." : "Regenerate"}
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

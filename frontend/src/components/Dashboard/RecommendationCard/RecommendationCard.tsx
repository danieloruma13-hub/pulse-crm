import { useState } from "react";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Percent,
} from "lucide-react";
import api from "../../../lib/api";
import styles from "./RecommendationCard.module.css";

function parseRecommendations(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.replace(/^\d+[\.\)]\s*/, ''));
}

export default function RecommendationCard({ stats }) {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerate() {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/ai/recommend-actions');
      setRecommendations(parseRecommendations(data.recommendations));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not generate recommendations');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={styles.card}>

      <div className={styles.header}>

        <div className={styles.icon}>
          <Sparkles size={18} />
        </div>

        <div>
          <h2>AI Recommendations</h2>
          <p>Powered by your live pipeline data</p>
        </div>

      </div>

      <div className={styles.score}>

        <div>

          <h1>{stats ? `${stats.conversionRate}%` : '...'}</h1>

          <span>Conversion Rate</span>

        </div>

        <Percent size={42} />

      </div>

      {error && <div style={{ color: '#fca5a5', fontSize: '0.85rem', marginBottom: 12 }}>{error}</div>}

      {recommendations ? (
        <div className={styles.list}>
          {recommendations.map((item, i) => (
            <div key={i} className={styles.item}>
              <CheckCircle2 size={18} />
              <div>
                <p>{item}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '0.85rem', marginBottom: 16 }}>
          Get AI-generated next actions based on your actual leads, deals, and tasks.
        </p>
      )}

      <button className={styles.button} onClick={handleGenerate} disabled={loading}>
        {loading ? 'Thinking...' : (recommendations ? 'Regenerate' : 'Generate AI Insights')}
        <ArrowRight size={17} />
      </button>

    </section>
  );
}

import { Zap, MessageSquare, Calendar as CalendarIcon, Mail, CreditCard, Webhook } from "lucide-react";
import AppLayout from "../../components/Layout/AppLayout";
import styles from "./Integrations.module.css";

const INTEGRATIONS = [
  { name: "Zapier", icon: Zap, description: "Connect Pulse CRM to thousands of other apps through automated workflows." },
  { name: "Slack", icon: MessageSquare, description: "Get notified in Slack when leads, deals, or tasks change." },
  { name: "Google Calendar", icon: CalendarIcon, description: "Two-way sync between Pulse CRM events and your Google Calendar." },
  { name: "Mailchimp", icon: Mail, description: "Sync your contacts with Mailchimp email lists automatically." },
  { name: "Stripe", icon: CreditCard, description: "Track payments and invoices directly against your deals." },
  { name: "Webhooks", icon: Webhook, description: "Send real-time CRM events to any external URL you choose." },
];

export default function Integrations() {
  return (
    <AppLayout title="Integrations" subtitle="Connect Pulse CRM with the rest of your toolkit">
      <div className={styles.noticeBox}>
        These integrations are planned but not built yet \u2014 each requires its own developer approval process with the third-party platform. This page shows what is coming, not what is live today.
      </div>

      <div className={styles.grid}>
        {INTEGRATIONS.map((item) => (
          <div key={item.name} className={styles.card}>
            <div className={styles.cardIcon}>
              <item.icon size={22} />
            </div>
            <div className={styles.cardTitle}>{item.name}</div>
            <p className={styles.cardDesc}>{item.description}</p>
            <span className={styles.comingSoon}>Coming Soon</span>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}

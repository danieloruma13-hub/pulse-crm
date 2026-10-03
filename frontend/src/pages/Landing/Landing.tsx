import { Link } from "react-router-dom";
import {
  Sparkles,
  Brain,
  Users,
  Zap,
  ShieldCheck,
  TrendingUp,
  Clock,
  ArrowRight,
  Calendar,
  Bell,
} from "lucide-react";

import styles from "./Landing.module.css";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Insights",
    description: "Get smart recommendations and predictions.",
  },
  {
    icon: Users,
    title: "Centralize Your Relationships",
    description: "All your leads, conversations, and deals in one place.",
  },
  {
    icon: Zap,
    title: "Automate & Save Time",
    description: "Let AI handle follow-ups, reminders, and repetitive tasks.",
  },
];

const stats = [
  {
    icon: Users,
    value: "10K+",
    label: "Businesses Trust Pulse CRM",
  },
  {
    icon: TrendingUp,
    value: "25%",
    label: "Average Sales Increase",
  },
  {
    icon: Clock,
    value: "15+",
    label: "Hours Saved Weekly",
  },
  {
    icon: ShieldCheck,
    value: "99.9%",
    label: "Uptime & Data Security",
  },
];

export default function Landing() {
  return (
    <main className={styles.hero}>

      <img
        src="/hero-office.png"
        alt=""
        className={styles.bg}
      />

      <div className={styles.overlay}></div>

      <div className={styles.left}>


        <div className={styles.logo}>

          <div className={styles.logoIcon}>
            <Sparkles size={18}/>
          </div>

          <span>Pulse CRM</span>

        </div>


        <h1>
          Smarter CRM.
          <br/>
          <span>Stronger Relationships.</span>
        </h1>

        <p>
          Pulse CRM helps you capture leads, close deals,
          and build lasting customer relationships —
          all in one intelligent platform.
        </p>

        <div className={styles.features}>
          {features.map(({icon:Icon,title,description})=>(
            <div className={styles.feature} key={title}>

              <div className={styles.featureIcon}>
                <Icon size={20}/>
              </div>

              <div>

                <h3>{title}</h3>

                <small>{description}</small>

              </div>

            </div>
          ))}
        </div>

        <div className={styles.buttons}>

          <Link to="/register" className={styles.primary}>
            Get Started
            <ArrowRight size={18}/>
          </Link>

          <Link to="/login" className={styles.secondary}>
            Sign In
          </Link>

        </div>

        <div className={styles.secure}>
          <ShieldCheck size={15}/>
          Your data is secure and encrypted
        </div>

      </div>

      <div className={`${styles.card} ${styles.card1}`}>
        <Users size={18}/>
        <div>
          <strong>12,540</strong>
          <span>Total Leads</span>
        </div>
      </div>

      <div className={`${styles.card} ${styles.card2}`}>
        <Calendar size={18}/>
        <div>
          <strong>3</strong>
          <span>Meetings Today</span>
        </div>
      </div>

      <div className={`${styles.card} ${styles.card3}`}>
        <Bell size={18}/>
        <div>
          <strong>5</strong>
          <span>AI Insights</span>
        </div>
      </div>

      <div className={styles.stats}>
        {stats.map(({icon:Icon,value,label})=>(
          <div className={styles.stat} key={label}>

            <Icon size={22}/>

            <div>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>

          </div>
        ))}
      </div>

    </main>
  );
}
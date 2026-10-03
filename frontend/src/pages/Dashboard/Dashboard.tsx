import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, clearSession } from "../../lib/auth";
import api from "../../lib/api";

import {
  Users,
  UserPlus,
  DollarSign,
  Percent,
  Briefcase,
} from "lucide-react";

import Sidebar from "../../components/Dashboard/Sidebar/Sidebar";
import Topbar from "../../components/Dashboard/Topbar/Topbar";
import HeroBanner from "../../components/Dashboard/HeroBanner/HeroBanner";
import StatCard from "../../components/Dashboard/StatCard/StatCard";
import RevenueChart from "../../components/Dashboard/RevenueChart/RevenueChart";
import RecommendationCard from "../../components/Dashboard/RecommendationCard/RecommendationCard";
import CalendarCard from "../../components/Dashboard/CalendarCard/CalendarCard";
import TasksCard from "../../components/Dashboard/TasksCard/TasksCard";
import ActivityCard from "../../components/Dashboard/ActivityCard/ActivityCard";
import AssistantCard from "../../components/Dashboard/AssistantCard/AssistantCard";
import QuickActions from "../../components/Dashboard/QuickActions/QuickActions";
import SalesPipeline from "../../components/Dashboard/SalesPipeline/SalesPipeline";

import styles from "./Dashboard.module.css";

interface DashboardStats {
  totalLeads: number;
  newCustomersThisMonth: number;
  revenue: number;
  conversionRate: number;
  activeCampaigns: number;
  openDeals: number;
}

interface DashboardData {
  stats: DashboardStats;
  pipeline: { stage: string; leadCount: number; value: number }[];
  schedule: any[];
  tasks: any[];
  recentActivity: any[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

export default function Dashboard() {
  const user = getCurrentUser();
  const navigate = useNavigate();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const { data: res } = await api.get('/dashboard');
        if (!cancelled) {
          setData(res);
          setError('');
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Could not load dashboard data');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDashboard();
    return () => { cancelled = true; };
  }, []);

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <div className={styles.dashboard}>

      {/* SIDEBAR */}
      <Sidebar
        user={user}
        onLogout={handleLogout}
      />

      {/* MAIN DASHBOARD */}
      <main className={styles.main}>

        <Topbar user={user} />

        <HeroBanner user={user} stats={data?.stats} />

        {error && (
          <div style={{ color: '#fca5a5', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* STATISTICS */}
        <section className={styles.statsGrid}>

          <StatCard
            title="Total Leads"
            value={loading ? '...' : (data?.stats.totalLeads.toLocaleString() ?? '0')}
            change="All time"
            icon={<Users size={22} />}
          />

          <StatCard
            title="New Customers"
            value={loading ? '...' : (data?.stats.newCustomersThisMonth.toLocaleString() ?? '0')}
            change="This month"
            icon={<UserPlus size={22} />}
          />

          <StatCard
            title="Revenue"
            value={loading ? '...' : formatCurrency(data?.stats.revenue ?? 0)}
            change="Won deals, all time"
            icon={<DollarSign size={22} />}
          />

          <StatCard
            title="Conversion Rate"
            value={loading ? '...' : `${data?.stats.conversionRate ?? 0}%`}
            change="Leads converted"
            icon={<Percent size={22} />}
          />

          <StatCard
            title="Active Campaigns"
            value={loading ? '...' : (data?.stats.activeCampaigns.toLocaleString() ?? '0')}
            change="Coming soon"
            icon={<Briefcase size={22} />}
          />

          <StatCard
            title="Open Deals"
            value={loading ? '...' : (data?.stats.openDeals.toLocaleString() ?? '0')}
            change="In progress"
            icon={<Briefcase size={22} />}
          />

        </section>

        {/* ANALYTICS */}
        <section className={styles.pipelineSection}>
          <SalesPipeline pipeline={data?.pipeline} />
         </section>

       <section className={styles.analytics}>
           <RevenueChart />
          <RecommendationCard stats={data?.stats} />
       </section>

        {/* LOWER DASHBOARD */}
        <section className={styles.lowerGrid}>

          <CalendarCard events={data?.schedule} />

          <TasksCard tasks={data?.tasks} />

          <ActivityCard activity={data?.recentActivity} />

        </section>

      </main>

      {/* RIGHT SIDEBAR */}
      <aside className={styles.rightPanel}>

        <AssistantCard />

        <QuickActions />

      </aside>

    </div>
  );
}

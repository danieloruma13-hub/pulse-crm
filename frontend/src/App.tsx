import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing/Landing';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Contacts from './pages/Contacts/Contacts';
import Leads from './pages/Leads/Leads';
import AIAssistant from './pages/AIAssistant/AIAssistant';
import Conversations from './pages/Conversations/Conversations';
import SalesPipelinePage from './pages/SalesPipelinePage/SalesPipelinePage';
import Settings from './pages/Settings/Settings';
import EmailCampaigns from './pages/EmailCampaigns/EmailCampaigns';
import Tasks from './pages/Tasks/Tasks';
import Analytics from './pages/Analytics/Analytics';
import Automations from './pages/Automations/Automations';
import Calendar from './pages/Calendar/Calendar';
import Reports from './pages/Reports/Reports';
import SocialMedia from './pages/SocialMedia/SocialMedia';
import Integrations from './pages/Integrations/Integrations';
import { isAuthenticated } from './lib/auth';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
      <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
      <Route path="/ai-assistant" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
      <Route path="/conversations" element={<ProtectedRoute><Conversations /></ProtectedRoute>} />
      <Route path="/pipeline" element={<ProtectedRoute><SalesPipelinePage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/email-campaigns" element={<ProtectedRoute><EmailCampaigns /></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
      <Route path="/automations" element={<ProtectedRoute><Automations /></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/social-media" element={<ProtectedRoute><SocialMedia /></ProtectedRoute>} />
      <Route path="/integrations" element={<ProtectedRoute><Integrations /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;

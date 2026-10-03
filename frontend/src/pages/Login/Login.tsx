import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import AuthLayout from '../../components/AuthLayout/AuthLayout';
import api from '../../lib/api';
import { saveSession } from '../../lib/auth';
import form from '../../styles/form.module.css';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      saveSession(data.accessToken, data.refreshToken, data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue to Pulse CRM">
      <form onSubmit={handleSubmit}>
        {error && <div className={form.error}>{error}</div>}

        <div className={form.field}>
          <label className={form.label} htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className={form.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className={form.field}>
          <label className={form.label} htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className={form.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        <button type="submit" className={form.submit} disabled={loading}>
          {loading ? 'Signing in...' : (<><LogIn size={16} /> Sign In</>)}
        </button>
      </form>

      <div className={form.footer}>
        Don't have an account? <Link to="/register">Get started</Link>
      </div>
    </AuthLayout>
  );
}

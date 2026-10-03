import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import AuthLayout from '../../components/AuthLayout/AuthLayout';
import api from '../../lib/api';
import { saveSession } from '../../lib/auth';
import form from '../../styles/form.module.css';

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      saveSession(data.accessToken, data.refreshToken, data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Start closing more deals with Pulse CRM">
      <form onSubmit={handleSubmit}>
        {error && <div className={form.error}>{error}</div>}

        <div className={form.field}>
          <label className={form.label} htmlFor="name">Full name</label>
          <input
            id="name"
            type="text"
            className={form.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
        </div>

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
            autoComplete="new-password"
          />
        </div>

        <div className={form.field}>
          <label className={form.label} htmlFor="confirmPassword">Confirm password</label>
          <input
            id="confirmPassword"
            type="password"
            className={form.input}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>

        <button type="submit" className={form.submit} disabled={loading}>
          {loading ? 'Creating account...' : (<><UserPlus size={16} /> Get Started</>)}
        </button>
      </form>

      <div className={form.footer}>
        Already have an account? <Link to="/login">Sign in</Link>
      </div>
    </AuthLayout>
  );
}

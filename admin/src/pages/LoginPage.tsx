// admin/src/pages/LoginPage.tsx
// ──────────────────────────────
// Operator sign-in. Calls login() from AuthContext, which authenticates AND
// verifies is_admin via /admin/me. On success → dashboard; on a non-admin 403
// or bad credentials, the error is shown inline.

import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="organic-card p-10 w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-leaf-600 p-2.5 rounded-2xl text-white shadow-organic-sm">
            <Leaf size={24} strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <span className="block text-2xl font-serif font-bold text-compost-900">
              Rawbin
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-leaf-600">
              Admin
            </span>
          </div>
        </div>

        <h1 className="text-2xl font-serif font-bold text-compost-900 mb-1">
          Operator sign in
        </h1>
        <p className="text-text-secondary mb-6">
          Administrator access only.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            autoComplete="username"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
            autoComplete="current-password"
          />

          {error && (
            <p className="text-terracotta-500 text-sm font-medium px-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary mt-2 disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

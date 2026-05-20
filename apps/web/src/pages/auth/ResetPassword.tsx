import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const { t } = useLanguage();
  const navigate = useNavigate();

  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);

  useEffect(() => {
    let mounted = true;

    const validateToken = async () => {
      if (!token) {
        setTokenValid(false);
        setValidating(false);
        return;
      }

      try {
        const { data } = await api.get('/auth/reset-password/validate', { params: { token } });
        if (!mounted) return;
        setTokenValid(!!data.valid);
      } catch {
        if (!mounted) return;
        setTokenValid(false);
      } finally {
        if (mounted) {
          setValidating(false);
        }
      }
    };

    validateToken();

    return () => {
      mounted = false;
    };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError(t('resetPassword.passwordTooShort'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('resetPassword.passwordMismatch'));
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword: password,
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1800);
    } catch (err: any) {
      setError(err.response?.data?.error || t('resetPassword.genericError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-amber-50 via-slate-50 to-amber-100/70 dark:from-[#0f0f0f] dark:via-[#151515] dark:to-[#201908]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(250,204,21,0.22),transparent_36%),radial-gradient(circle_at_88%_8%,rgba(0,0,0,0.09),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.45),rgba(255,255,255,0))] dark:bg-[radial-gradient(circle_at_15%_0%,rgba(250,204,21,0.14),transparent_34%),radial-gradient(circle_at_85%_0%,rgba(250,204,21,0.08),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))]"></div>
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] dark:opacity-[0.06] bg-[url('/logo.jpg')] bg-[length:240px_240px] bg-repeat [mask-image:radial-gradient(circle_at_center,black,transparent_80%)]"></div>

      <div className="relative min-h-screen flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full bg-white/95 dark:bg-zinc-900/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-amber-200 dark:border-amber-500/20">
          <div className="text-center mb-6">
            <Link to="/" className="inline-block">
              <img
                src="/logo.jpg"
                alt="FreeSquash Logo"
                className="mx-auto w-16 h-16 rounded-full object-cover border-4 border-white dark:border-zinc-700 shadow-lg mb-3 hover:scale-105 transition-transform cursor-pointer"
              />
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">{t('resetPassword.title')}</h1>
          <p className="text-slate-600 mb-6">{t('resetPassword.subtitle')}</p>

          {validating ? (
            <p className="text-slate-600 text-sm">{t('resetPassword.validating')}</p>
          ) : !tokenValid ? (
            <div className="space-y-5">
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm font-semibold text-red-700">{t('resetPassword.invalidToken')}</p>
              </div>
              <Link
                to="/forgot-password"
                className="inline-flex w-full items-center justify-center px-4 py-3 text-black font-semibold rounded-lg bg-yellow-400 border-2 border-black/90 hover:bg-yellow-300 transition-colors"
              >
                {t('resetPassword.requestNew')}
              </Link>
              <div>
                <Link to="/login" className="text-amber-700 font-medium hover:text-amber-800">
                  {t('resetPassword.backToLogin')}
                </Link>
              </div>
            </div>
          ) : success ? (
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
              {t('resetPassword.success')}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                  {t('resetPassword.newPassword')}
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="********"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                  {t('resetPassword.confirmPassword')}
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="********"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 text-black font-semibold rounded-lg bg-yellow-400 border-2 border-black/90 hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t('resetPassword.submitting') : t('resetPassword.submit')}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

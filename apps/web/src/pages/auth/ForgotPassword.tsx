import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || t('forgotPassword.genericError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-slate-50 to-amber-100/70 px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-amber-200">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{t('forgotPassword.title')}</h1>
        <p className="text-slate-600 mb-6">{t('forgotPassword.subtitle')}</p>

        {success ? (
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
            {t('forgotPassword.success')}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                {t('forgotPassword.email')}
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="tu@email.com"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 text-black font-semibold rounded-lg bg-yellow-400 border-2 border-black/90 hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('forgotPassword.submitting') : t('forgotPassword.submit')}
            </button>
          </form>
        )}

        <p className="mt-6 text-sm text-slate-600">
          <Link to="/login" className="text-amber-700 font-medium hover:text-amber-800">
            {t('forgotPassword.backToLogin')}
          </Link>
        </p>
      </div>
    </div>
  );
}

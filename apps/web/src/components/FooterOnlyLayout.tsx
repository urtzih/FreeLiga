import { Link, Outlet } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from './i18n/LanguageSelector';

export default function FooterOnlyLayout() {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col">
            <main className="flex-1">
                <Outlet />
            </main>

            <footer className="bg-gray-100 dark:bg-gray-800 py-8 border-t border-slate-200 dark:border-slate-700">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="flex flex-col items-start gap-3">
                            <div className="flex items-center gap-3">
                                <img src="/logo.jpg" alt="FreeSquash Liga" className="h-12 w-12 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                                <span className="text-lg font-semibold text-slate-800 dark:text-white">Free Squash Gasteiz</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{t('footer.platform')}</p>
                        </div>

                        <div className="flex flex-col items-end gap-3">
                            <Link to="/report-bug" className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors whitespace-nowrap text-sm">
                                🐞 {t('footer.reportBug')}
                            </Link>
                            <a href="mailto:ligafreesquash@gmail.com" className="text-sm text-gray-600 dark:text-gray-300 hover:underline">{t('footer.contact')}</a>
                            <LanguageSelector className="flex items-center" />
                        </div>
                    </div>

                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                        <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
                            <Link to="/privacy" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                                {t('footer.privacy')}
                            </Link>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <Link to="/terms" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                                {t('footer.terms')}
                            </Link>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <Link to="/legal" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                                {t('footer.legal')}
                            </Link>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
                            {t('footer.copyright', { year: new Date().getFullYear() })}
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}


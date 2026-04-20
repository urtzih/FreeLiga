import { Link, Outlet } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from './i18n/LanguageSelector';

export default function FooterOnlyLayout() {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-amber-100/20 to-white flex flex-col">
            <main className="flex-1">
                <Outlet />
            </main>

            <footer className="bg-[#171717] bg-club-black-900 py-8 border-t border-club-yellow-700/40 text-amber-100">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="flex flex-col items-start gap-3">
                            <div className="flex items-center gap-3">
                                <img src="/logo.jpg" alt="FreeSquash Liga" className="h-12 w-12 rounded-full object-cover border border-club-yellow-400" />
                                <span className="text-lg font-semibold text-club-yellow-300">Free Squash Gasteiz</span>
                            </div>
                            <p className="text-sm text-amber-100/80">{t('footer.platform')}</p>
                            <Link
                                to="/report-bug"
                                className="inline-flex items-center px-3 py-1.5 rounded-lg border border-club-yellow-500/55 text-amber-100/85 hover:text-club-yellow-200 hover:border-club-yellow-400 hover:bg-club-yellow-400/10 transition-colors whitespace-nowrap text-sm"
                            >
                                {t('footer.reportBug')}
                            </Link>
                        </div>

                        <div className="flex flex-col items-end gap-3">
                            <a href="mailto:ligafreesquash@gmail.com" className="text-sm text-amber-100/80 hover:text-club-yellow-300 hover:underline">{t('footer.contact')}</a>
                            <LanguageSelector className="flex items-center" tone="dark" />
                        </div>
                    </div>

                    <div className="border-t border-club-yellow-700/40 pt-4">
                        <div className="flex flex-wrap gap-4 text-xs text-amber-100/80">
                            <Link to="/privacy" className="hover:text-club-yellow-300 transition-colors">
                                {t('footer.privacy')}
                            </Link>
                            <span className="text-amber-200/40">•</span>
                            <Link to="/terms" className="hover:text-club-yellow-300 transition-colors">
                                {t('footer.terms')}
                            </Link>
                            <span className="text-amber-200/40">•</span>
                            <Link to="/legal" className="hover:text-club-yellow-300 transition-colors">
                                {t('footer.legal')}
                            </Link>
                        </div>
                        <p className="text-xs text-amber-200/60 mt-4">
                            {t('footer.copyright', { year: new Date().getFullYear() })}
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}


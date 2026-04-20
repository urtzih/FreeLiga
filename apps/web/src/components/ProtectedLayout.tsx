import { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatMessage, TranslationKey } from '../i18n/messages';
import LanguageSelector from './i18n/LanguageSelector';

export default function ProtectedLayout() {
    const { user, logout, isAdmin } = useAuth();
    const { t, language, setLanguage } = useLanguage();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const currentGroup = user?.player?.currentGroup;
    const calendarEnabled = user?.player?.calendarEnabled ?? false;
    const translate = (key: TranslationKey, params?: Record<string, string | number>) => {
        return isAdmin ? formatMessage('es', key, params) : t(key, params);
    };

    const groupPrefix = translate('nav.groupPrefix');
    const groupLabel = currentGroup?.name
        ? (currentGroup.name.toLowerCase().startsWith('grupo') || currentGroup.name.toLowerCase().startsWith('talde')
            ? currentGroup.name
            : `${groupPrefix} ${currentGroup.name}`)
        : groupPrefix;

    const handleLogout = () => {
        logout();
        navigate('/login');
        setMobileMenuOpen(false);
    };

    const closeMobileMenu = () => setMobileMenuOpen(false);

    useEffect(() => {
        if (isAdmin && language !== 'es') {
            setLanguage('es');
        }
    }, [isAdmin, language, setLanguage]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-slate-50 to-amber-100/70 dark:from-[#0f0f0f] dark:via-[#151515] dark:to-[#201908]">
            <nav className="bg-zinc-950 shadow-[0_10px_28px_rgba(0,0,0,0.5)] border-b border-amber-500/30 ring-1 ring-amber-500/15 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <Link to="/dashboard" className="flex items-center space-x-3" onClick={closeMobileMenu}>
                                <img
                                    src="/logo.jpg"
                                    alt="FreeSquash Logo"
                                    className="h-10 w-10 rounded-full object-cover border border-amber-500/60"
                                />
                                <span className="text-xl font-bold text-amber-200">
                                    Free Squash Liga
                                </span>
                            </Link>
                        </div>

                        <div className="hidden md:flex items-center space-x-1">
                            {isAdmin ? (
                                <>
                                    <Link
                                        to="/admin/users"
                                        className="px-3 py-2 rounded-md text-sm font-medium text-amber-100 hover:bg-zinc-800 hover:text-amber-200 transition-colors"
                                    >
                                        {translate('nav.admin.users')}
                                    </Link>
                                    <Link
                                        to="/admin/seasons"
                                        className="px-3 py-2 rounded-md text-sm font-medium text-amber-100 hover:bg-zinc-800 hover:text-amber-200 transition-colors"
                                    >
                                        {translate('nav.admin.seasons')}
                                    </Link>
                                    <Link
                                        to="/admin/groups"
                                        className="px-3 py-2 rounded-md text-sm font-medium text-amber-100 hover:bg-zinc-800 hover:text-amber-200 transition-colors"
                                    >
                                        {translate('nav.admin.groups')}
                                    </Link>
                                    <Link
                                        to="/matches/history"
                                        className="px-3 py-2 rounded-md text-sm font-medium text-amber-100 hover:bg-zinc-800 hover:text-amber-200 transition-colors"
                                    >
                                        {translate('nav.admin.viewAllMatches')}
                                    </Link>
                                    <Link
                                        to="/admin/push-notifications"
                                        className="px-3 py-2 rounded-md text-sm font-medium text-amber-100 hover:bg-zinc-800 hover:text-amber-200 transition-colors"
                                    >
                                        {translate('nav.admin.notifications')}
                                    </Link>
                                    <div className="relative group">
                                        <button
                                            type="button"
                                            className="px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 text-amber-100 hover:bg-zinc-800 hover:text-amber-200 transition-colors"
                                        >
                                            <span>{translate('nav.more')}</span>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        <div className="absolute left-0 w-48 rounded-lg shadow-lg bg-zinc-900 border border-amber-500/45 py-2 hidden group-hover:block z-50">
                                            <Link to="/blacklist" className="block px-4 py-2 text-sm text-amber-100 hover:bg-zinc-800 hover:text-amber-200">{translate('nav.admin.blacklist')}</Link>
                                            <Link to="/admin/bugs" className="block px-4 py-2 text-sm text-amber-100 hover:bg-zinc-800 hover:text-amber-200">{translate('nav.admin.bugs')}</Link>
                                            <Link to="/admin/help" className="block px-4 py-2 text-sm text-amber-100 hover:bg-zinc-800 hover:text-amber-200">{translate('nav.admin.help')}</Link>
                                            <Link to="/admin/cache" className="block px-4 py-2 text-sm text-amber-100 hover:bg-zinc-800 hover:text-amber-200">{translate('nav.admin.cache')}</Link>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/dashboard"
                                        className="px-3 py-2 rounded-md text-sm font-medium text-amber-100 hover:bg-zinc-800 hover:text-amber-200 transition-colors"
                                    >
                                        {translate('nav.player.home')}
                                    </Link>
                                    <Link
                                        to={user?.player?.currentGroup ? `/groups/${user.player.currentGroup.id}` : '/dashboard'}
                                        className="px-3 py-2 rounded-md text-sm font-medium text-amber-100 hover:bg-zinc-800 hover:text-amber-200 transition-colors"
                                    >
                                        {groupLabel}
                                    </Link>
                                    {calendarEnabled && (
                                        <Link
                                            to="/calendar"
                                            className="px-3 py-2 rounded-md text-sm font-medium text-amber-100 hover:bg-zinc-800 hover:text-amber-200 transition-colors"
                                        >
                                            {translate('nav.player.calendar')}
                                        </Link>
                                    )}
                                    <Link
                                        to="/matches/record"
                                        className="px-3 py-2 rounded-md text-sm font-medium text-amber-100 hover:bg-zinc-800 hover:text-amber-200 transition-colors"
                                    >
                                        {translate('nav.player.record')}
                                    </Link>
                                    <div className="relative group">
                                        <button
                                            type="button"
                                            className="px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 text-amber-100 hover:bg-zinc-800 hover:text-amber-200 transition-colors"
                                        >
                                            <span>{translate('nav.more')}</span>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        <div className="absolute left-0 w-44 rounded-lg shadow-lg bg-zinc-900 border border-amber-500/45 py-2 hidden group-hover:block z-50">
                                            <Link to="/progress" className="block px-4 py-2 text-sm text-amber-100 hover:bg-zinc-800 hover:text-amber-200">{translate('nav.player.progress')}</Link>
                                            <Link to="/groups/summary" className="block px-4 py-2 text-sm text-amber-100 hover:bg-zinc-800 hover:text-amber-200">{translate('nav.player.groupsSummary')}</Link>
                                            <Link to="/matches/history" className="block px-4 py-2 text-sm text-amber-100 hover:bg-zinc-800 hover:text-amber-200">{translate('nav.player.matchHistory')}</Link>
                                            <Link to="/historia" className="block px-4 py-2 text-sm text-amber-100 hover:bg-zinc-800 hover:text-amber-200">{translate('nav.player.general')}</Link>
                                            <Link to="/blacklist" className="block px-4 py-2 text-sm text-amber-100 hover:bg-zinc-800 hover:text-amber-200">{translate('nav.player.blacklist')}</Link>
                                            <Link to="/help" className="block px-4 py-2 text-sm text-amber-100 hover:bg-zinc-800 hover:text-amber-200">{translate('nav.player.help')}</Link>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="hidden md:flex items-center space-x-3 ml-4 pl-4 border-l border-amber-500/30">
                            <Link
                                to="/profile"
                                className="text-sm text-amber-100/85 hover:text-amber-200 max-w-[150px] truncate transition-colors cursor-pointer"
                                title={translate('nav.viewProfile')}
                            >
                                {user?.player?.name || user?.email}
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 text-sm rounded-lg border border-amber-500/40 bg-zinc-800 text-amber-100 hover:bg-zinc-700 transition-colors"
                            >
                                {translate('nav.logout')}
                            </button>
                        </div>

                        <div className="flex items-center gap-3 md:hidden ml-auto">
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="inline-flex items-center justify-center p-2 rounded-md border border-amber-400/45 bg-zinc-900 text-amber-100 shadow-[0_4px_12px_rgba(0,0,0,0.35)] hover:text-amber-200 hover:bg-zinc-800 hover:border-amber-300/70 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-400"
                                aria-label={translate('nav.menu')}
                            >
                                {mobileMenuOpen ? (
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                ) : (
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-amber-500/30 bg-zinc-950">
                        <div className="px-2 pt-2 pb-3 space-y-1">
                            {isAdmin ? (
                                <>
                                    <Link to="/admin" onClick={closeMobileMenu} className="block px-3 py-2 rounded-md text-base font-medium text-amber-100 hover:bg-zinc-800 hover:text-amber-200 transition-colors">
                                        {translate('nav.admin.dashboard')}
                                    </Link>
                                    <Link to="/admin/users" onClick={closeMobileMenu} className="block px-3 py-2 rounded-md text-base font-medium text-amber-100 hover:bg-zinc-800 hover:text-amber-200 transition-colors">
                                        {translate('nav.admin.users')}
                                    </Link>
                                    <Link to="/admin/seasons" onClick={closeMobileMenu} className="block px-3 py-2 rounded-md text-base font-medium text-amber-100 hover:bg-zinc-800 hover:text-amber-200 transition-colors">
                                        {translate('nav.admin.seasons')}
                                    </Link>
                                    <Link to="/admin/groups" onClick={closeMobileMenu} className="block px-3 py-2 rounded-md text-base font-medium text-amber-100 hover:bg-zinc-800 hover:text-amber-200 transition-colors">
                                        {translate('nav.admin.groups')}
                                    </Link>
                                    <Link to="/admin/bugs" onClick={closeMobileMenu} className="block px-3 py-2 rounded-md text-base font-medium text-amber-100 hover:bg-zinc-800 hover:text-amber-200 transition-colors">
                                        {translate('nav.admin.bugs')}
                                    </Link>
                                    <Link to="/admin/help" onClick={closeMobileMenu} className="block px-3 py-2 rounded-md text-base font-medium text-amber-100 hover:bg-zinc-800 hover:text-amber-200 transition-colors">
                                        {translate('nav.admin.help')}
                                    </Link>
                                    <Link to="/admin/cache" onClick={closeMobileMenu} className="block px-3 py-2 rounded-md text-base font-medium text-amber-100 hover:bg-zinc-800 hover:text-amber-200 transition-colors">
                                        {translate('nav.admin.cache')}
                                    </Link>
                                    <Link to="/matches/history" onClick={closeMobileMenu} className="block px-3 py-2 rounded-md text-base font-medium text-amber-100 hover:bg-zinc-800 hover:text-amber-200 transition-colors">
                                        {translate('nav.admin.viewAllMatches')}
                                    </Link>
                                    <Link to="/blacklist" onClick={closeMobileMenu} className="block px-3 py-2 rounded-md text-base font-medium text-amber-100 hover:bg-zinc-800 hover:text-amber-200 transition-colors">
                                        {translate('nav.admin.blacklist')}
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <div className="rounded-xl border border-amber-500/20 bg-zinc-950/80 divide-y divide-amber-500/15">
                                        <Link to="/dashboard" onClick={closeMobileMenu} className="block px-4 py-3 text-base font-semibold text-amber-100 hover:bg-zinc-900 hover:text-amber-200 transition-colors">
                                            {translate('nav.player.home')}
                                        </Link>
                                        <Link to={user?.player?.currentGroup ? `/groups/${user.player.currentGroup.id}` : '/dashboard'} onClick={closeMobileMenu} className="block px-4 py-3 text-base font-semibold text-amber-100 hover:bg-zinc-900 hover:text-amber-200 transition-colors">
                                            {groupLabel}
                                        </Link>
                                        <Link to="/matches/record" onClick={closeMobileMenu} className="block px-4 py-3 text-base font-semibold text-amber-100 hover:bg-zinc-900 hover:text-amber-200 transition-colors">
                                            {translate('nav.player.recordMatch')}
                                        </Link>
                                        {calendarEnabled && (
                                            <Link to="/calendar" onClick={closeMobileMenu} className="block px-4 py-3 text-base font-semibold text-amber-100 hover:bg-zinc-900 hover:text-amber-200 transition-colors">
                                                {translate('nav.player.calendar')}
                                            </Link>
                                        )}
                                        <details className="group border-t border-amber-500/15">
                                            <summary className="list-none cursor-pointer px-4 py-3 text-base font-semibold text-amber-100 hover:bg-zinc-900 hover:text-amber-200 transition-colors flex items-center justify-between">
                                                <span>{translate('nav.more')}</span>
                                                <svg className="h-4 w-4 text-amber-300/80 transition-transform duration-200 group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </summary>
                                            <div className="border-t border-amber-500/10 divide-y divide-amber-500/10">
                                                <Link to="/progress" onClick={closeMobileMenu} className="block px-4 py-3 text-base font-semibold text-amber-100 hover:bg-zinc-900 hover:text-amber-200 transition-colors">{translate('nav.player.progress')}</Link>
                                                <Link to="/groups/summary" onClick={closeMobileMenu} className="block px-4 py-3 text-base font-semibold text-amber-100 hover:bg-zinc-900 hover:text-amber-200 transition-colors">{translate('nav.player.groupsSummary')}</Link>
                                                <Link to="/matches/history" onClick={closeMobileMenu} className="block px-4 py-3 text-base font-semibold text-amber-100 hover:bg-zinc-900 hover:text-amber-200 transition-colors">{translate('nav.player.matchHistory')}</Link>
                                                <Link to="/historia" onClick={closeMobileMenu} className="block px-4 py-3 text-base font-semibold text-amber-100 hover:bg-zinc-900 hover:text-amber-200 transition-colors">{translate('nav.player.general')}</Link>
                                                <Link to="/blacklist" onClick={closeMobileMenu} className="block px-4 py-3 text-base font-semibold text-amber-100 hover:bg-zinc-900 hover:text-amber-200 transition-colors">{translate('nav.player.blacklist')}</Link>
                                                <Link to="/help" onClick={closeMobileMenu} className="block px-4 py-3 text-base font-semibold text-amber-100 hover:bg-zinc-900 hover:text-amber-200 transition-colors">{translate('nav.player.help')}</Link>
                                            </div>
                                        </details>
                                    </div>
                                </>
                            )}

                            <div className="pt-4 mt-4 border-t border-amber-500/30">
                                <Link to="/profile" onClick={closeMobileMenu} className="block px-3 py-2 hover:bg-zinc-900 rounded-md transition-colors">
                                    <div className="text-sm font-medium text-amber-100">
                                        {user?.player?.name || user?.email}
                                    </div>
                                    <div className="text-xs text-amber-200/70 mt-1">
                                        {translate('nav.viewProfileShort')}
                                    </div>
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="mt-2 w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-300 hover:bg-red-900/25 transition-colors"
                                >
                                    {translate('nav.logout')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            <section className="relative overflow-hidden">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(250,204,21,0.22),transparent_36%),radial-gradient(circle_at_88%_8%,rgba(0,0,0,0.09),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.45),rgba(255,255,255,0))] dark:bg-[radial-gradient(circle_at_15%_0%,rgba(250,204,21,0.14),transparent_34%),radial-gradient(circle_at_85%_0%,rgba(250,204,21,0.08),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))]"></div>
                <div className="pointer-events-none absolute inset-0 opacity-[0.04] dark:opacity-[0.06] bg-[url('/logo.jpg')] bg-[length:240px_240px] bg-repeat [mask-image:radial-gradient(circle_at_center,black,transparent_80%)]"></div>
                <main className="relative max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
                    <Outlet />
                </main>
            </section>

            <footer className="bg-zinc-950 text-amber-100 py-8 mt-8 border-t border-amber-500/30">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col items-start gap-3">
                            <div className="flex items-center gap-3">
                                <img src="/logo.jpg" alt="FreeSquash Liga" className="h-12 w-12 rounded-full object-cover border border-amber-400/70" />
                                <span className="text-lg font-semibold text-amber-200">Free Squash Gasteiz</span>
                            </div>
                            <p className="text-sm text-amber-100/80">{translate('footer.platform')}</p>
                            <Link
                                to="/report-bug"
                                className="inline-flex items-center px-3 py-1.5 rounded-lg border border-amber-400/45 text-amber-100/85 hover:text-amber-100 hover:border-amber-300 hover:bg-amber-400/10 transition-colors whitespace-nowrap text-sm"
                            >
                                {translate('footer.reportBug')}
                            </Link>
                        </div>

                        <div className="flex flex-col items-end gap-3">
                            <a href="mailto:ligafreesquash@gmail.com" className="text-sm text-amber-100/90 hover:text-amber-200 hover:underline">{translate('footer.contact')}</a>
                            {!isAdmin && <LanguageSelector className="flex items-center" tone="dark" />}
                        </div>
                    </div>

                    <div className="border-t border-amber-500/30 pt-4 mt-6">
                        <p className="text-xs text-amber-200/70">
                            {translate('footer.copyright', { year: new Date().getFullYear() })}
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}





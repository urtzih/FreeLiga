import { Link } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const RecentMatches = lazy(() => import('../components/RecentMatches'));
const PublicGroupsClassification = lazy(() => import('../components/PublicGroupsClassification'));
const PublicStats = lazy(() => import('../components/PublicStats'));
const PublicHistoricalStats = lazy(() => import('../components/PublicHistoricalStats'));

export default function Home() {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-amber-100/30 to-white">
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 club-hero-pattern"></div>
                <div className="absolute inset-0 club-dither-overlay opacity-90"></div>
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14">
                    <div className="text-center">
                        <div className="mb-5 sm:mb-8 flex justify-center">
                            <img
                                src="/logo.jpg"
                                alt="FreeSquash Logo"
                                className="w-24 h-24 sm:w-36 sm:h-36 lg:w-48 lg:h-48 rounded-full object-cover border-4 border-club-yellow-300 shadow-2xl hover:scale-105 transition-transform cursor-pointer"
                            />
                        </div>

                        <h1 className="text-3xl sm:text-6xl lg:text-7xl leading-[1.1] font-extrabold text-club-yellow-300 mb-3 sm:mb-6">
                            {t('home.hero.title')}
                        </h1>
                        <p className="text-base sm:text-2xl text-white/95 mb-2 sm:mb-4 max-w-3xl mx-auto">
                            {t('home.hero.subtitle')}
                        </p>
                        <p className="text-sm sm:text-lg text-amber-100/90 mb-5 sm:mb-8 max-w-2xl mx-auto">
                            {t('home.hero.description')}
                        </p>

                        <div className="flex justify-center">
                            <Link
                                to="/login"
                                className="club-btn-primary px-6 py-3 sm:px-10 sm:py-4 text-base sm:text-lg"
                            >
                                {t('home.hero.cta')}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-amber-50/40 py-8 sm:py-16 border-y border-amber-200/70">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Suspense fallback={<div className="text-center py-8">{t('home.loadingData')}</div>}>
                        <PublicHistoricalStats />
                        <PublicStats />

                        <div className="mb-16">
                            <PublicGroupsClassification />
                            <div className="text-center mt-8">
                                <Link
                                    to="/public/groups"
                                    className="club-btn-secondary px-8 py-3"
                                >
                                    {t('home.exploreGroups')} →
                                </Link>
                            </div>
                        </div>

                        <div>
                            <RecentMatches />
                            <div className="text-center mt-6">
                                <Link
                                    to="/public/matches"
                                    className="club-btn-secondary px-8 py-3"
                                >
                                    {t('home.viewAllMatches')} →
                                </Link>
                            </div>
                        </div>
                    </Suspense>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
                <h2 className="text-2xl sm:text-4xl font-bold text-center text-club-black-900 mb-5 sm:mb-12">
                    {t('home.features.title')}
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-8">
                    <div className="club-surface p-3 sm:p-6 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200">
                        <div className="text-2xl sm:text-4xl mb-2 sm:mb-4">🏆</div>
                        <h3 className="text-sm sm:text-xl font-bold text-club-black-900 mb-1 sm:mb-3">{t('home.features.levelGroups.title')}</h3>
                        <p className="text-club-black-700">
                            {t('home.features.levelGroups.description')}
                        </p>
                    </div>

                    <div className="club-surface p-3 sm:p-6 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200">
                        <div className="text-2xl sm:text-4xl mb-2 sm:mb-4">🎾</div>
                        <h3 className="text-sm sm:text-xl font-bold text-club-black-900 mb-1 sm:mb-3">{t('home.features.matchRecord.title')}</h3>
                        <p className="text-club-black-700">
                            {t('home.features.matchRecord.description')}
                        </p>
                    </div>

                    <div className="club-surface p-3 sm:p-6 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200">
                        <div className="text-2xl sm:text-4xl mb-2 sm:mb-4">📊</div>
                        <h3 className="text-sm sm:text-xl font-bold text-club-black-900 mb-1 sm:mb-3">{t('home.features.fairRanking.title')}</h3>
                        <p className="text-club-black-700">
                            {t('home.features.fairRanking.description')}
                        </p>
                    </div>

                    <div className="club-surface p-3 sm:p-6 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200">
                        <div className="text-2xl sm:text-4xl mb-2 sm:mb-4">📈</div>
                        <h3 className="text-sm sm:text-xl font-bold text-club-black-900 mb-1 sm:mb-3">{t('home.features.progress.title')}</h3>
                        <p className="text-club-black-700">
                            {t('home.features.progress.description')}
                        </p>
                    </div>

                    <div className="club-surface p-3 sm:p-6 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200">
                        <div className="text-2xl sm:text-4xl mb-2 sm:mb-4">📞</div>
                        <h3 className="text-sm sm:text-xl font-bold text-club-black-900 mb-1 sm:mb-3">{t('home.features.contact.title')}</h3>
                        <p className="text-club-black-700">
                            {t('home.features.contact.description')}
                        </p>
                    </div>

                    <div className="club-surface p-3 sm:p-6 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200">
                        <div className="text-2xl sm:text-4xl mb-2 sm:mb-4">⬆️⬇️</div>
                        <h3 className="text-sm sm:text-xl font-bold text-club-black-900 mb-1 sm:mb-3">{t('home.features.promotions.title')}</h3>
                        <p className="text-club-black-700">
                            {t('home.features.promotions.description')}
                        </p>
                    </div>
                </div>
            </div>

            <div className="relative overflow-hidden py-8 sm:py-16">
                <div className="absolute inset-0 club-hero-pattern"></div>
                <div className="absolute inset-0 club-dither-overlay opacity-60"></div>
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="club-reading-panel">
                        <h2 className="text-2xl sm:text-4xl font-bold text-center text-white mb-6 sm:mb-12 drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)]">
                            {t('home.howItWorks.title')}
                        </h2>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-8">
                            <div className="text-center">
                                <div className="club-step-card">
                                    <div className="bg-yellow-200 border-2 border-black/80 rounded-full w-10 h-10 sm:w-16 sm:h-16 flex items-center justify-center text-lg sm:text-2xl font-bold text-black mx-auto mb-2 sm:mb-4 shadow-lg">
                                        1
                                    </div>
                                    <h3 className="text-sm sm:text-xl font-bold text-white mb-1 sm:mb-2">{t('home.howItWorks.step1.title')}</h3>
                                    <p className="text-xs sm:text-base club-page-hero-subtitle">
                                        {t('home.howItWorks.step1.description')}
                                    </p>
                                </div>
                            </div>

                            <div className="text-center">
                                <div className="club-step-card">
                                    <div className="bg-yellow-200 border-2 border-black/80 rounded-full w-10 h-10 sm:w-16 sm:h-16 flex items-center justify-center text-lg sm:text-2xl font-bold text-black mx-auto mb-2 sm:mb-4 shadow-lg">
                                        2
                                    </div>
                                    <h3 className="text-sm sm:text-xl font-bold text-white mb-1 sm:mb-2">{t('home.howItWorks.step2.title')}</h3>
                                    <p className="text-xs sm:text-base club-page-hero-subtitle">
                                        {t('home.howItWorks.step2.description')}
                                    </p>
                                </div>
                            </div>

                            <div className="text-center">
                                <div className="club-step-card">
                                    <div className="bg-yellow-200 border-2 border-black/80 rounded-full w-10 h-10 sm:w-16 sm:h-16 flex items-center justify-center text-lg sm:text-2xl font-bold text-black mx-auto mb-2 sm:mb-4 shadow-lg">
                                        3
                                    </div>
                                    <h3 className="text-sm sm:text-xl font-bold text-white mb-1 sm:mb-2">{t('home.howItWorks.step3.title')}</h3>
                                    <p className="text-xs sm:text-base club-page-hero-subtitle">
                                        {t('home.howItWorks.step3.description')}
                                    </p>
                                </div>
                            </div>

                            <div className="text-center">
                                <div className="club-step-card">
                                    <div className="bg-yellow-200 border-2 border-black/80 rounded-full w-10 h-10 sm:w-16 sm:h-16 flex items-center justify-center text-lg sm:text-2xl font-bold text-black mx-auto mb-2 sm:mb-4 shadow-lg">
                                        4
                                    </div>
                                    <h3 className="text-sm sm:text-xl font-bold text-white mb-1 sm:mb-2">{t('home.howItWorks.step4.title')}</h3>
                                    <p className="text-xs sm:text-base club-page-hero-subtitle">
                                        {t('home.howItWorks.step4.description')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
                <div className="bg-gradient-to-br from-amber-50 via-white to-amber-100/70 rounded-2xl shadow-xl p-4 sm:p-8 border-2 border-amber-300">
                    <div className="text-center mb-4 sm:mb-8">
                        <span className="inline-block bg-club-black-900 text-club-yellow-300 text-xs sm:text-sm font-semibold px-3 py-1 rounded-full mb-3">
                            {t('home.mobileInstall.recommended')}
                        </span>
                        <div className="text-2xl sm:text-5xl mb-2 sm:mb-4">📱</div>
                        <h2 className="text-xl sm:text-3xl font-bold text-club-black-900 mb-2 sm:mb-4">
                            {t('home.mobileInstall.title')}
                        </h2>
                        <p className="text-sm sm:text-lg text-club-black-700 max-w-3xl mx-auto">
                            {t('home.mobileInstall.subtitle')}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-6 max-w-4xl mx-auto">
                        <div className="club-surface p-3 sm:p-6">
                            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                                <div className="text-3xl sm:text-4xl">📲</div>
                                <h3 className="text-sm sm:text-xl font-bold text-club-black-900">{t('home.mobileInstall.installTitle')}</h3>
                            </div>
                            <p className="text-xs sm:text-sm text-club-black-700 mb-3 sm:mb-5">
                                {t('home.mobileInstall.installHint')}
                            </p>

                            <div className="space-y-3 sm:space-y-5">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xl">🤖</span>
                                        <h4 className="text-sm sm:text-base font-semibold text-club-black-900">{t('home.mobileInstall.android.title')}</h4>
                                    </div>
                                    <ol className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-club-black-700">
                                        <li>{t('home.mobileInstall.android.step1')}</li>
                                        <li>{t('home.mobileInstall.android.step2')}</li>
                                        <li>{t('home.mobileInstall.android.step3')}</li>
                                        <li>{t('home.mobileInstall.android.step4')}</li>
                                    </ol>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xl">🍎</span>
                                        <h4 className="text-sm sm:text-base font-semibold text-club-black-900">{t('home.mobileInstall.ios.title')}</h4>
                                    </div>
                                    <ol className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-club-black-700">
                                        <li>{t('home.mobileInstall.ios.step1')}</li>
                                        <li>{t('home.mobileInstall.ios.step2')}</li>
                                        <li>{t('home.mobileInstall.ios.step3')}</li>
                                        <li>{t('home.mobileInstall.ios.step4')}</li>
                                    </ol>
                                </div>
                            </div>
                        </div>

                        <div className="club-surface p-3 sm:p-6">
                            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                                <div className="text-3xl sm:text-4xl">🔔</div>
                                <h3 className="text-sm sm:text-xl font-bold text-club-black-900">{t('home.mobileInstall.notifications.title')}</h3>
                            </div>
                            <p className="text-xs sm:text-sm text-club-black-700 mb-3 sm:mb-5">
                                {t('home.mobileInstall.notifications.subtitle')}
                            </p>
                            <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-club-black-700">
                                <li className="flex gap-2">
                                    <span className="text-club-yellow-700 font-bold">✓</span>
                                    <span>{t('home.mobileInstall.notifications.step1')}</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-club-yellow-700 font-bold">✓</span>
                                    <span>{t('home.mobileInstall.notifications.step2')}</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-club-yellow-700 font-bold">✓</span>
                                    <span>{t('home.mobileInstall.notifications.step3')}</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-club-yellow-700 font-bold">✓</span>
                                    <span>{t('home.mobileInstall.notifications.step4')}</span>
                                </li>
                            </ul>
                            <div className="mt-3 sm:mt-5 space-y-2">
                                <p className="text-xs text-club-black-700 bg-amber-50 rounded-lg p-2 sm:p-3 border border-amber-200/70">
                                    {t('home.mobileInstall.notifications.androidTip')}
                                </p>
                                <p className="text-xs text-club-black-700 bg-amber-50 rounded-lg p-2 sm:p-3 border border-amber-200/70">
                                    {t('home.mobileInstall.notifications.iosTip')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-3 sm:mt-6">
                        <p className="text-xs sm:text-sm text-center text-club-black-700 italic">
                            💡 {t('home.mobileInstall.note')}
                        </p>
                    </div>
                </div>
            </div>

            <div className="relative overflow-hidden py-8 sm:py-16">
                <div className="absolute inset-0 club-hero-pattern"></div>
                <div className="absolute inset-0 club-dither-overlay opacity-55"></div>
                <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3 sm:mb-6">
                        {t('home.existingMembers.title')}
                    </h2>
                    <p className="text-sm sm:text-xl text-white/95 mb-4 sm:mb-8 drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]">
                        {t('home.existingMembers.description')}
                    </p>
                    <div className="flex justify-center">
                        <Link
                            to="/login"
                            className="club-btn-primary px-7 sm:px-12 py-2.5 sm:py-4 text-sm sm:text-lg"
                        >
                            {t('home.existingMembers.cta')}
                        </Link>
                    </div>
                    <p className="mt-3 sm:mt-6 inline-block px-3 py-1.5 rounded-full bg-black/45 text-white text-xs sm:text-sm">
                        {t('home.existingMembers.help')}
                    </p>
                </div>
            </div>

        </div>
    );
}



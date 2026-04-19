import { Link } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from '../components/i18n/LanguageSelector';

const RecentMatches = lazy(() => import('../components/RecentMatches'));
const PublicGroupsClassification = lazy(() => import('../components/PublicGroupsClassification'));
const PublicStats = lazy(() => import('../components/PublicStats'));
const PublicHistoricalStats = lazy(() => import('../components/PublicHistoricalStats'));

export default function Home() {
    const { t } = useLanguage();

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50">
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-amber-600 opacity-5"></div>
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14">
                    <div className="text-center">
                        <div className="mb-5 sm:mb-8 flex justify-center">
                            <img
                                src="/logo.jpg"
                                alt="FreeSquash Logo"
                                className="w-24 h-24 sm:w-36 sm:h-36 lg:w-48 lg:h-48 rounded-full object-cover border-4 border-white dark:border-slate-700 shadow-2xl hover:scale-105 transition-transform cursor-pointer"
                            />
                        </div>

                        <h1 className="text-3xl sm:text-6xl lg:text-7xl leading-[1.1] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-amber-600 mb-3 sm:mb-6">
                            {t('home.hero.title')}
                        </h1>
                        <p className="text-base sm:text-2xl text-gray-700 mb-2 sm:mb-4 max-w-3xl mx-auto">
                            {t('home.hero.subtitle')}
                        </p>
                        <p className="text-sm sm:text-lg text-gray-600 mb-5 sm:mb-8 max-w-2xl mx-auto">
                            {t('home.hero.description')}
                        </p>

                        <div className="flex justify-center">
                            <Link
                                to="/login"
                                className="px-6 py-3 sm:px-10 sm:py-4 bg-gradient-to-r from-amber-600 to-amber-600 text-white text-base sm:text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                            >
                                {t('home.hero.cta')}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white py-8 sm:py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Suspense fallback={<div className="text-center py-8">{t('home.loadingData')}</div>}>
                        <PublicHistoricalStats />
                        <PublicStats />

                        <div className="mb-16">
                            <PublicGroupsClassification />
                            <div className="text-center mt-8">
                                <Link
                                    to="/public/groups"
                                    className="inline-block px-8 py-3 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors"
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
                                    className="inline-block px-8 py-3 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors"
                                >
                                    {t('home.viewAllMatches')} →
                                </Link>
                            </div>
                        </div>
                    </Suspense>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
                <h2 className="text-2xl sm:text-4xl font-bold text-center text-gray-900 mb-5 sm:mb-12">
                    {t('home.features.title')}
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-8">
                    <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200">
                        <div className="text-2xl sm:text-4xl mb-2 sm:mb-4">🏆</div>
                        <h3 className="text-sm sm:text-xl font-bold text-gray-900 mb-1 sm:mb-3">{t('home.features.levelGroups.title')}</h3>
                        <p className="text-gray-600">
                            {t('home.features.levelGroups.description')}
                        </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200">
                        <div className="text-2xl sm:text-4xl mb-2 sm:mb-4">🎾</div>
                        <h3 className="text-sm sm:text-xl font-bold text-gray-900 mb-1 sm:mb-3">{t('home.features.matchRecord.title')}</h3>
                        <p className="text-gray-600">
                            {t('home.features.matchRecord.description')}
                        </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200">
                        <div className="text-2xl sm:text-4xl mb-2 sm:mb-4">📊</div>
                        <h3 className="text-sm sm:text-xl font-bold text-gray-900 mb-1 sm:mb-3">{t('home.features.fairRanking.title')}</h3>
                        <p className="text-gray-600">
                            {t('home.features.fairRanking.description')}
                        </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200">
                        <div className="text-2xl sm:text-4xl mb-2 sm:mb-4">📈</div>
                        <h3 className="text-sm sm:text-xl font-bold text-gray-900 mb-1 sm:mb-3">{t('home.features.progress.title')}</h3>
                        <p className="text-gray-600">
                            {t('home.features.progress.description')}
                        </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200">
                        <div className="text-2xl sm:text-4xl mb-2 sm:mb-4">📞</div>
                        <h3 className="text-sm sm:text-xl font-bold text-gray-900 mb-1 sm:mb-3">{t('home.features.contact.title')}</h3>
                        <p className="text-gray-600">
                            {t('home.features.contact.description')}
                        </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200">
                        <div className="text-2xl sm:text-4xl mb-2 sm:mb-4">⬆️⬇️</div>
                        <h3 className="text-sm sm:text-xl font-bold text-gray-900 mb-1 sm:mb-3">{t('home.features.promotions.title')}</h3>
                        <p className="text-gray-600">
                            {t('home.features.promotions.description')}
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-r from-amber-600 to-amber-600 py-8 sm:py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-2xl sm:text-4xl font-bold text-center text-white mb-6 sm:mb-12">
                        {t('home.howItWorks.title')}
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-8">
                        <div className="text-center">
                            <div className="bg-white rounded-full w-10 h-10 sm:w-16 sm:h-16 flex items-center justify-center text-lg sm:text-2xl font-bold text-amber-600 mx-auto mb-2 sm:mb-4 shadow-lg">
                                1
                            </div>
                            <h3 className="text-sm sm:text-xl font-bold text-white mb-1 sm:mb-2">{t('home.howItWorks.step1.title')}</h3>
                            <p className="hidden sm:block text-amber-100">
                                {t('home.howItWorks.step1.description')}
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="bg-white rounded-full w-10 h-10 sm:w-16 sm:h-16 flex items-center justify-center text-lg sm:text-2xl font-bold text-amber-600 mx-auto mb-2 sm:mb-4 shadow-lg">
                                2
                            </div>
                            <h3 className="text-sm sm:text-xl font-bold text-white mb-1 sm:mb-2">{t('home.howItWorks.step2.title')}</h3>
                            <p className="hidden sm:block text-amber-100">
                                {t('home.howItWorks.step2.description')}
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="bg-white rounded-full w-10 h-10 sm:w-16 sm:h-16 flex items-center justify-center text-lg sm:text-2xl font-bold text-amber-600 mx-auto mb-2 sm:mb-4 shadow-lg">
                                3
                            </div>
                            <h3 className="text-sm sm:text-xl font-bold text-white mb-1 sm:mb-2">{t('home.howItWorks.step3.title')}</h3>
                            <p className="hidden sm:block text-amber-100">
                                {t('home.howItWorks.step3.description')}
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="bg-white rounded-full w-10 h-10 sm:w-16 sm:h-16 flex items-center justify-center text-lg sm:text-2xl font-bold text-amber-600 mx-auto mb-2 sm:mb-4 shadow-lg">
                                4
                            </div>
                            <h3 className="text-sm sm:text-xl font-bold text-white mb-1 sm:mb-2">{t('home.howItWorks.step4.title')}</h3>
                            <p className="hidden sm:block text-amber-100">
                                {t('home.howItWorks.step4.description')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
                <div className="bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-amber-900/20 dark:via-slate-900 dark:to-amber-900/20 rounded-2xl shadow-xl p-4 sm:p-8 border-2 border-amber-200 dark:border-amber-700">
                    <div className="text-center mb-4 sm:mb-8">
                        <span className="inline-block bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200 text-xs sm:text-sm font-semibold px-3 py-1 rounded-full mb-3">
                            {t('home.mobileInstall.recommended')}
                        </span>
                        <div className="text-2xl sm:text-5xl mb-2 sm:mb-4">📱</div>
                        <h2 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-4">
                            {t('home.mobileInstall.title')}
                        </h2>
                        <p className="text-sm sm:text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                            {t('home.mobileInstall.subtitle')}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-6 max-w-4xl mx-auto">
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-6 shadow-lg border border-amber-100 dark:border-slate-700">
                            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                                <div className="text-3xl sm:text-4xl">📲</div>
                                <h3 className="text-sm sm:text-xl font-bold text-gray-900 dark:text-white">{t('home.mobileInstall.installTitle')}</h3>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-3 sm:mb-5">
                                {t('home.mobileInstall.installHint')}
                            </p>

                            <div className="space-y-3 sm:space-y-5">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xl">🤖</span>
                                        <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">{t('home.mobileInstall.android.title')}</h4>
                                    </div>
                                    <ol className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                                        <li>{t('home.mobileInstall.android.step1')}</li>
                                        <li>{t('home.mobileInstall.android.step2')}</li>
                                        <li>{t('home.mobileInstall.android.step3')}</li>
                                        <li>{t('home.mobileInstall.android.step4')}</li>
                                    </ol>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xl">🍎</span>
                                        <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">{t('home.mobileInstall.ios.title')}</h4>
                                    </div>
                                    <ol className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                                        <li>{t('home.mobileInstall.ios.step1')}</li>
                                        <li>{t('home.mobileInstall.ios.step2')}</li>
                                        <li>{t('home.mobileInstall.ios.step3')}</li>
                                        <li>{t('home.mobileInstall.ios.step4')}</li>
                                    </ol>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-6 shadow-lg border border-amber-100 dark:border-slate-700">
                            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                                <div className="text-3xl sm:text-4xl">🔔</div>
                                <h3 className="text-sm sm:text-xl font-bold text-gray-900 dark:text-white">{t('home.mobileInstall.notifications.title')}</h3>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-3 sm:mb-5">
                                {t('home.mobileInstall.notifications.subtitle')}
                            </p>
                            <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                                <li className="flex gap-2">
                                    <span className="text-amber-600 dark:text-amber-400 font-bold">✓</span>
                                    <span>{t('home.mobileInstall.notifications.step1')}</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-amber-600 dark:text-amber-400 font-bold">✓</span>
                                    <span>{t('home.mobileInstall.notifications.step2')}</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-amber-600 dark:text-amber-400 font-bold">✓</span>
                                    <span>{t('home.mobileInstall.notifications.step3')}</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-amber-600 dark:text-amber-400 font-bold">✓</span>
                                    <span>{t('home.mobileInstall.notifications.step4')}</span>
                                </li>
                            </ul>
                            <div className="mt-3 sm:mt-5 space-y-2">
                                <p className="text-xs text-gray-600 dark:text-gray-400 bg-amber-50 dark:bg-slate-900 rounded-lg p-2 sm:p-3">
                                    {t('home.mobileInstall.notifications.androidTip')}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 bg-amber-50 dark:bg-slate-900 rounded-lg p-2 sm:p-3">
                                    {t('home.mobileInstall.notifications.iosTip')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-3 sm:mt-6">
                        <p className="text-xs sm:text-sm text-center text-gray-600 dark:text-gray-400 italic">
                            💡 {t('home.mobileInstall.note')}
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-r from-amber-600 to-amber-600 py-8 sm:py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3 sm:mb-6">
                        {t('home.existingMembers.title')}
                    </h2>
                    <p className="text-sm sm:text-xl text-amber-100 mb-4 sm:mb-8">
                        {t('home.existingMembers.description')}
                    </p>
                    <div className="flex justify-center">
                        <Link
                            to="/login"
                            className="px-7 sm:px-12 py-2.5 sm:py-4 bg-white text-amber-600 text-sm sm:text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                        >
                            {t('home.existingMembers.cta')}
                        </Link>
                    </div>
                    <p className="mt-3 sm:mt-6 text-amber-100 text-xs sm:text-sm">
                        {t('home.existingMembers.help')}
                    </p>
                </div>
            </div>

            <footer className="bg-gray-900 text-gray-300 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-2">
                    <p className="text-sm">
                        {t('footer.copyright', { year: new Date().getFullYear() })}
                    </p>
                    <p className="text-xs text-gray-500">
                        {t('footer.managementSystem')}
                    </p>
                    <div className="flex justify-center pt-1">
                        <LanguageSelector className="flex items-center" />
                    </div>
                </div>
            </footer>
        </div>
    );
}


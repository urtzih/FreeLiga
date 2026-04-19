import { useId } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface LanguageSelectorProps {
    className?: string;
}

export default function LanguageSelector({ className }: LanguageSelectorProps) {
    const { language, setLanguage, t } = useLanguage();
    const selectId = useId();
    const rootClassName = className ?? 'flex items-center';

    return (
        <div className={rootClassName}>
            <label
                htmlFor={selectId}
                className="mr-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-300"
            >
                {t('language.label')}
            </label>
            <div className="relative">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path
                            d="M12 2a10 10 0 100 20 10 10 0 000-20zm7.94 9h-3.24a15.2 15.2 0 00-1.44-5.12A8.04 8.04 0 0119.94 11zM12 4.06c.86 1.08 1.93 3.29 2.3 6.94H9.7C10.07 7.35 11.14 5.14 12 4.06zM8.74 5.88A15.2 15.2 0 007.3 11H4.06a8.04 8.04 0 014.68-5.12zM4.06 13H7.3a15.2 15.2 0 001.44 5.12A8.04 8.04 0 014.06 13zm7.94 6.94c-.86-1.08-1.93-3.29-2.3-6.94h4.6c-.37 3.65-1.44 5.86-2.3 6.94zm3.26-1.82A15.2 15.2 0 0016.7 13h3.24a8.04 8.04 0 01-4.68 5.12z"
                            fill="currentColor"
                        />
                    </svg>
                </span>
                <select
                    id={selectId}
                    value={language}
                    onChange={(event) => setLanguage(event.target.value as 'es' | 'eu')}
                    className="appearance-none rounded-full border border-slate-300 dark:border-slate-600 bg-white/95 dark:bg-slate-700/90 py-1.5 pl-8 pr-8 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 shadow-sm transition-all hover:border-amber-400 dark:hover:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    aria-label={t('language.label')}
                >
                    <option value="es">{t('language.es')}</option>
                    <option value="eu">{t('language.eu')}</option>
                </select>
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path
                            fillRule="evenodd"
                            d="M5.23 7.21a.75.75 0 011.06.02L10 11.12l3.71-3.9a.75.75 0 111.08 1.04l-4.25 4.47a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                            clipRule="evenodd"
                        />
                    </svg>
                </span>
            </div>
        </div>
    );
}


import { useId } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface LanguageSelectorProps {
    className?: string;
}

export default function LanguageSelector({ className }: LanguageSelectorProps) {
    const { language, setLanguage, t } = useLanguage();
    const selectId = useId();

    return (
        <div className={className}>
            <label htmlFor={selectId} className="text-xs text-gray-600 dark:text-gray-300 mr-2">
                {t('language.label')}
            </label>
            <select
                id={selectId}
                value={language}
                onChange={(event) => setLanguage(event.target.value as 'es' | 'eu')}
                className="text-xs sm:text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500"
                aria-label={t('language.label')}
            >
                <option value="es">{t('language.es')}</option>
                <option value="eu">{t('language.eu')}</option>
            </select>
        </div>
    );
}


import { createContext, useContext } from 'react';
import type { Locale } from 'date-fns';
import { AppLanguage, TranslationKey } from '../i18n/messages';

export interface LanguageContextValue {
    language: AppLanguage;
    setLanguage: (language: AppLanguage) => void;
    t: (key: TranslationKey, params?: Record<string, string | number>) => string;
    localeCode: string;
    dateFnsLocale: Locale;
    formatDate: (value: Date | number | string, options?: Intl.DateTimeFormatOptions) => string;
    formatDateTime: (value: Date | number | string, options?: Intl.DateTimeFormatOptions) => string;
    formatTime: (value: Date | number | string, options?: Intl.DateTimeFormatOptions) => string;
}

export const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function useLanguage() {
    const context = useContext(LanguageContext);

    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }

    return context;
}

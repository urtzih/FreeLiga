import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { es as esLocale, eu as euLocale } from 'date-fns/locale';
import { AppLanguage, formatMessage, LANGUAGE_STORAGE_KEY, TranslationKey } from '../i18n/messages';
import { LanguageContext, type LanguageContextValue } from './LanguageContext';

const supportedLanguages: AppLanguage[] = ['es', 'eu'];
let runtimeLocaleCode = 'es-ES';
let localeProxyInstalled = false;
const originalToLocaleDateString = Date.prototype.toLocaleDateString;
const originalToLocaleString = Date.prototype.toLocaleString;
const originalToLocaleTimeString = Date.prototype.toLocaleTimeString;

function normalizeRequestedLocales(locales?: Intl.LocalesArgument) {
    const replaceLocale = (value: string | Intl.Locale) => {
        const localeValue = typeof value === 'string' ? value : value.toString();
        const normalized = localeValue.toLowerCase();
        if (normalized === 'es' || normalized === 'es-es') {
            return runtimeLocaleCode;
        }

        return localeValue;
    };

    if (!locales) {
        return runtimeLocaleCode;
    }

    if (typeof locales === 'string' || locales instanceof Intl.Locale) {
        return replaceLocale(locales);
    }

    if (Array.isArray(locales)) {
        return locales.map(replaceLocale);
    }

    return locales;
}

function installLocaleProxy() {
    if (localeProxyInstalled) {
        return;
    }

    localeProxyInstalled = true;

    Date.prototype.toLocaleDateString = function patchedToLocaleDateString(locales?: Intl.LocalesArgument, options?: Intl.DateTimeFormatOptions) {
        return originalToLocaleDateString.call(this, normalizeRequestedLocales(locales), options);
    };

    Date.prototype.toLocaleString = function patchedToLocaleString(locales?: Intl.LocalesArgument, options?: Intl.DateTimeFormatOptions) {
        return originalToLocaleString.call(this, normalizeRequestedLocales(locales), options);
    };

    Date.prototype.toLocaleTimeString = function patchedToLocaleTimeString(locales?: Intl.LocalesArgument, options?: Intl.DateTimeFormatOptions) {
        return originalToLocaleTimeString.call(this, normalizeRequestedLocales(locales), options);
    };
}

function normalizeLanguage(rawValue?: string | null): AppLanguage | null {
    if (!rawValue) {
        return null;
    }

    const value = rawValue.trim().toLowerCase();

    if (value.startsWith('eu')) {
        return 'eu';
    }

    if (value.startsWith('es')) {
        return 'es';
    }

    return null;
}

function detectBrowserLanguage(): AppLanguage {
    if (typeof navigator === 'undefined') {
        return 'es';
    }

    const candidates = Array.isArray(navigator.languages) && navigator.languages.length > 0
        ? navigator.languages
        : [navigator.language];

    for (const candidate of candidates) {
        const normalized = normalizeLanguage(candidate);
        if (normalized) {
            return normalized;
        }
    }

    return 'es';
}

function getInitialLanguage(): AppLanguage {
    if (typeof window === 'undefined') {
        return 'es';
    }

    try {
        const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
        const normalizedStoredLanguage = normalizeLanguage(storedLanguage);

        if (normalizedStoredLanguage) {
            return normalizedStoredLanguage;
        }
    } catch {
        // noop
    }

    return detectBrowserLanguage();
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<AppLanguage>(getInitialLanguage);

    const setLanguage = useCallback((nextLanguage: AppLanguage) => {
        const normalizedLanguage = supportedLanguages.includes(nextLanguage) ? nextLanguage : 'es';
        setLanguageState(normalizedLanguage);

        try {
            window.localStorage.setItem(LANGUAGE_STORAGE_KEY, normalizedLanguage);
        } catch {
            // noop
        }
    }, []);

    useEffect(() => {
        document.documentElement.lang = language;
        document.documentElement.setAttribute('data-language', language);
    }, [language]);

    const localeCode = language === 'eu' ? 'eu-ES' : 'es-ES';
    const dateFnsLocale = language === 'eu' ? euLocale : esLocale;

    useEffect(() => {
        runtimeLocaleCode = localeCode;
        installLocaleProxy();
    }, [localeCode]);

    const t = useCallback((key: TranslationKey, params?: Record<string, string | number>) => {
        return formatMessage(language, key, params);
    }, [language]);

    const formatDate = useCallback((value: Date | number | string, options?: Intl.DateTimeFormatOptions) => {
        return new Date(value).toLocaleDateString(localeCode, options);
    }, [localeCode]);

    const formatDateTime = useCallback((value: Date | number | string, options?: Intl.DateTimeFormatOptions) => {
        return new Date(value).toLocaleString(localeCode, options);
    }, [localeCode]);

    const formatTime = useCallback((value: Date | number | string, options?: Intl.DateTimeFormatOptions) => {
        return new Date(value).toLocaleTimeString(localeCode, options);
    }, [localeCode]);

    const contextValue = useMemo<LanguageContextValue>(() => ({
        language,
        setLanguage,
        t,
        localeCode,
        dateFnsLocale,
        formatDate,
        formatDateTime,
        formatTime,
    }), [dateFnsLocale, formatDate, formatDateTime, formatTime, language, localeCode, setLanguage, t]);

    return (
        <LanguageContext.Provider value={contextValue}>
            {children}
        </LanguageContext.Provider>
    );
}

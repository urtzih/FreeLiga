import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface PlayerAvatarProps {
    name?: string | null;
    photoDataUrl?: string | null;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    alt?: string;
}

const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-24 w-24 text-2xl',
};

function getInitials(name?: string | null) {
    const parts = (name || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

export default function PlayerAvatar({ name, photoDataUrl, size = 'md', className = '', alt }: PlayerAvatarProps) {
    const { t } = useLanguage();
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const baseClass = `${sizeClasses[size]} shrink-0 overflow-hidden rounded-full border border-amber-200 dark:border-amber-700 bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 font-bold inline-flex items-center justify-center ${className}`;
    const label = alt || name || '';

    if (photoDataUrl) {
        return (
            <>
                <button
                    type="button"
                    onClick={() => setIsPreviewOpen(true)}
                    className={`${baseClass} cursor-pointer transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 dark:focus:ring-offset-slate-900`}
                    aria-label={label ? t('avatar.openPhotoWithName', { name: label }) : t('avatar.openPhoto')}
                >
                    <img
                        src={photoDataUrl}
                        alt={label}
                        className="h-full w-full object-cover"
                        loading="lazy"
                    />
                </button>

                {isPreviewOpen && (
                    <div
                        className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
                        role="dialog"
                        aria-modal="true"
                        onClick={() => setIsPreviewOpen(false)}
                    >
                        <div className="w-full max-w-sm rounded-3xl border border-amber-300/40 bg-white p-6 text-center shadow-2xl dark:border-amber-500/40 dark:bg-slate-900" onClick={(event) => event.stopPropagation()}>
                            <img
                                src={photoDataUrl}
                                alt={label}
                                className="mx-auto h-64 w-64 max-w-full rounded-full border-4 border-amber-300 object-cover shadow-lg dark:border-amber-600"
                            />
                            {name && (
                                <p className="mt-4 text-lg font-bold text-slate-900 dark:text-white">{name}</p>
                            )}
                            <button
                                type="button"
                                onClick={() => setIsPreviewOpen(false)}
                                className="mt-5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                {t('common.close')}
                            </button>
                        </div>
                    </div>
                )}
            </>
        );
    }

    return (
        <span className={baseClass} aria-label={label || undefined}>
            {getInitials(name)}
        </span>
    );
}

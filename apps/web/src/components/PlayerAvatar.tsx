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
    const baseClass = `${sizeClasses[size]} shrink-0 overflow-hidden rounded-full border border-amber-200 dark:border-amber-700 bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 font-bold inline-flex items-center justify-center ${className}`;

    if (photoDataUrl) {
        return (
            <img
                src={photoDataUrl}
                alt={alt || name || ''}
                className={`${baseClass} object-cover`}
                loading="lazy"
            />
        );
    }

    return (
        <span className={baseClass} aria-label={alt || name || undefined}>
            {getInitials(name)}
        </span>
    );
}

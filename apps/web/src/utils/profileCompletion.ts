export const GENERIC_EMAIL_DOMAIN = '@ejemplo.com';

export function hasGenericEmail(email?: string | null) {
    return (email || '').trim().toLowerCase().endsWith(GENERIC_EMAIL_DOMAIN);
}

export function hasMissingPhone(phone?: string | null) {
    return !(phone || '').trim();
}

export function hasMissingPhoto(photoDataUrl?: string | null) {
    return !(photoDataUrl || '').trim();
}

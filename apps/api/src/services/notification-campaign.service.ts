import {
    NotificationCampaignStatus,
    NotificationCampaignType,
    NotificationTargetType,
    prisma,
} from '@freesquash/database';
import { logBusinessEvent, logger } from '../utils/logger';
import { PushNotificationInput, PushTarget, sendPushByTarget } from './push-notification.service';

const DEFAULT_TIMEZONE = 'Europe/Madrid';
const STALE_LOCK_MS = 10 * 60 * 1000;

type TemplateCategory = 'ON_DEMAND' | 'SCHEDULED';
export type NotificationTemplateKey = string;

interface TemplateDefinition {
    key: string;
    category: TemplateCategory;
    label: string;
    description: string;
    defaultTitle: string;
    defaultBody: string;
    defaultUrl: string;
}

interface SendNowInput {
    templateKey: string;
    title?: string;
    body?: string;
    url?: string;
    targetType: NotificationTargetType;
    targetValue?: string;
    createdById: string;
}

interface CreateScheduledInput {
    templateKey: string;
    title?: string;
    body?: string;
    url?: string;
    targetType: NotificationTargetType;
    targetValue?: string;
    createdById: string;
    status?: NotificationCampaignStatus;
    timezone?: string;
}

interface UpdateScheduledInput {
    templateKey?: string;
    title?: string;
    body?: string;
    url?: string | null;
    targetType?: NotificationTargetType;
    targetValue?: string | null;
    status?: NotificationCampaignStatus;
    timezone?: string;
    nextRunAt?: Date | null;
}

const TEMPLATE_DEFINITIONS: Record<string, TemplateDefinition> = {
    NEW_TOURNAMENT: {
        key: 'NEW_TOURNAMENT',
        category: 'ON_DEMAND',
        label: 'Nuevo torneo',
        description: 'Anuncio inmediato de apertura de torneo',
        defaultTitle: 'Nuevo torneo disponible',
        defaultBody: 'Ya puedes apuntarte al nuevo torneo desde la app.',
        defaultUrl: '/dashboard',
    },
    NEW_FEATURE: {
        key: 'NEW_FEATURE',
        category: 'ON_DEMAND',
        label: 'Nueva funcionalidad',
        description: 'Comunicación de nuevas funcionalidades publicadas',
        defaultTitle: 'Nueva funcionalidad en FreeLiga',
        defaultBody: 'Hemos publicado una mejora. Entra y pruébala ahora.',
        defaultUrl: '/dashboard',
    },
    MAINTENANCE: {
        key: 'MAINTENANCE',
        category: 'ON_DEMAND',
        label: 'Mantenimiento programado',
        description: 'Aviso de ventana de mantenimiento',
        defaultTitle: 'Mantenimiento programado',
        defaultBody: 'Habrá una ventana de mantenimiento. Te avisaremos cuando termine.',
        defaultUrl: '/dashboard',
    },
    INCIDENT_RESOLVED: {
        key: 'INCIDENT_RESOLVED',
        category: 'ON_DEMAND',
        label: 'Incidencia resuelta',
        description: 'Confirmación de recuperación de servicio',
        defaultTitle: 'Incidencia resuelta',
        defaultBody: 'El servicio vuelve a estar operativo. Gracias por tu paciencia.',
        defaultUrl: '/dashboard',
    },
    URGENT_ANNOUNCEMENT: {
        key: 'URGENT_ANNOUNCEMENT',
        category: 'ON_DEMAND',
        label: 'Comunicado urgente',
        description: 'Aviso urgente enviado al momento',
        defaultTitle: 'Comunicado importante',
        defaultBody: 'Tenemos una actualización urgente para todos los jugadores.',
        defaultUrl: '/dashboard',
    },
    SEASON_ROLLOVER_ANNOUNCEMENT: {
        key: 'SEASON_ROLLOVER_ANNOUNCEMENT',
        category: 'ON_DEMAND',
        label: 'Ascensos/descensos y nueva temporada',
        description: 'Comunicado de cierre y apertura de temporada',
        defaultTitle: 'Ascensos/descensos aplicados y nueva temporada disponible',
        defaultBody: 'Ya se han aplicado los ascensos y descensos. La nueva temporada ya esta disponible para empezar a jugar.',
        defaultUrl: '/dashboard',
    },
    SEASON_START: {
        key: 'SEASON_START',
        category: 'SCHEDULED',
        label: 'Inicio nueva temporada',
        description: 'Día de inicio de temporada a las 09:00',
        defaultTitle: '¡Empieza la nueva temporada!',
        defaultBody: 'La temporada comienza hoy. Revisa tu grupo y tus partidos.',
        defaultUrl: '/dashboard',
    },
    SEASON_END_REMINDER: {
        key: 'SEASON_END_REMINDER',
        category: 'SCHEDULED',
        label: 'Fin de temporada (T-14/T-7/T-2)',
        description: 'Recordatorios automáticos antes del cierre de temporada',
        defaultTitle: 'Recordatorio de cierre de temporada',
        defaultBody: 'Se acerca el cierre de temporada. Revisa partidos pendientes.',
        defaultUrl: '/matches/history',
    },
    WEEKLY_PENDING_MATCH_REMINDER: {
        key: 'WEEKLY_PENDING_MATCH_REMINDER',
        category: 'SCHEDULED',
        label: 'Recordatorio semanal',
        description: 'Cada lunes a las 19:00',
        defaultTitle: 'Recordatorio semanal',
        defaultBody: 'Tienes una nueva semana para cerrar partidos pendientes.',
        defaultUrl: '/matches/history',
    },
    TOURNAMENT_REGISTRATION_DEADLINE_REMINDER: {
        key: 'TOURNAMENT_REGISTRATION_DEADLINE_REMINDER',
        category: 'SCHEDULED',
        label: 'Cierre inscripción torneo',
        description: 'Recordatorio a T-3 del próximo inicio de temporada',
        defaultTitle: 'Últimos días para apuntarte',
        defaultBody: 'Quedan pocos días para cerrar inscripciones del torneo.',
        defaultUrl: '/dashboard',
    },
    SEASON_END_SUMMARY: {
        key: 'SEASON_END_SUMMARY',
        category: 'SCHEDULED',
        label: 'Resumen fin de temporada',
        description: 'Día de cierre a las 21:00',
        defaultTitle: 'Temporada finalizada',
        defaultBody: 'La temporada ha terminado. Revisa clasificación y movimientos.',
        defaultUrl: '/historia',
    },
};

const TEMPLATE_KEYS = Object.keys(TEMPLATE_DEFINITIONS);
const TEMPLATE_KEY_SET = new Set(TEMPLATE_KEYS);

export function listNotificationTemplates() {
    return Object.values(TEMPLATE_DEFINITIONS);
}

export function getNotificationTemplateKeys() {
    return [...TEMPLATE_KEYS];
}

export function isNotificationTemplateKey(value: string): value is NotificationTemplateKey {
    return TEMPLATE_KEY_SET.has(value);
}

function getTemplateDefinition(templateKey: string): TemplateDefinition {
    const template = TEMPLATE_DEFINITIONS[templateKey];
    if (!template) {
        throw new Error(`Unknown templateKey: ${templateKey}`);
    }
    return template;
}

function requireTargetValue(targetType: NotificationTargetType, targetValue?: string | null) {
    if (targetType === NotificationTargetType.ALL) return;
    if (!targetValue || targetValue.trim().length === 0) {
        throw new Error('targetValue is required for selected targetType');
    }
}

function toPushTarget(targetType: NotificationTargetType, targetValue?: string | null): PushTarget {
    if (targetType === NotificationTargetType.ALL) {
        return { type: 'ALL' };
    }
    if (targetType === NotificationTargetType.GROUP) {
        return { type: 'GROUP', groupId: targetValue! };
    }
    return { type: 'USER', userId: targetValue! };
}

function resolveNotificationPayload(params: {
    templateKey: NotificationTemplateKey;
    title?: string | null;
    body?: string | null;
    url?: string | null;
    runAt?: Date;
}): PushNotificationInput {
    const template = getTemplateDefinition(params.templateKey);
    const title = params.title?.trim() || template.defaultTitle;
    const body = params.body?.trim() || template.defaultBody;
    const url = params.url?.trim() || template.defaultUrl;

    return {
        title,
        body,
        tag: params.templateKey.toLowerCase(),
        url,
        data: params.runAt
            ? {
                  runAt: params.runAt.toISOString(),
              }
            : undefined,
    };
}

export async function sendNowCampaign(input: SendNowInput) {
    requireTargetValue(input.targetType, input.targetValue);

    const payload = resolveNotificationPayload({
        templateKey: input.templateKey,
        title: input.title,
        body: input.body,
        url: input.url,
    });

    const target = toPushTarget(input.targetType, input.targetValue);

    const campaign = await prisma.notificationCampaign.create({
        data: {
            type: NotificationCampaignType.ON_DEMAND,
            templateKey: input.templateKey,
            title: payload.title,
            body: payload.body,
            url: payload.url,
            targetType: input.targetType,
            targetValue: input.targetValue || null,
            status: NotificationCampaignStatus.RUNNING,
            timezone: DEFAULT_TIMEZONE,
            createdById: input.createdById,
        },
    });

    try {
        const result = await sendPushByTarget(target, payload);
        const runAt = new Date();

        await prisma.notificationDispatch.create({
            data: {
                campaignId: campaign.id,
                runAt,
                sent: result.sent,
                failed: result.failed,
                errorSummary: result.failed > 0 ? `Failed deliveries: ${result.failed}` : null,
            },
        });

        await prisma.notificationCampaign.update({
            where: { id: campaign.id },
            data: {
                status: NotificationCampaignStatus.COMPLETED,
                lastRunAt: runAt,
                nextRunAt: null,
                lastError: result.failed > 0 ? `Failed deliveries: ${result.failed}` : null,
            },
        });

        logBusinessEvent('notification_send_now', {
            campaignId: campaign.id,
            createdById: input.createdById,
            templateKey: input.templateKey,
            targetType: input.targetType,
            sent: result.sent,
            failed: result.failed,
            audience: result.audience,
        });

        return {
            campaignId: campaign.id,
            sent: result.sent,
            failed: result.failed,
            audience: result.audience,
        };
    } catch (error: any) {
        await prisma.notificationCampaign.update({
            where: { id: campaign.id },
            data: {
                status: NotificationCampaignStatus.FAILED,
                lastError: error?.message || 'Unknown error',
            },
        });
        throw error;
    }
}

export async function createScheduledCampaign(input: CreateScheduledInput) {
    const template = getTemplateDefinition(input.templateKey);
    if (template.category !== 'SCHEDULED') {
        throw new Error('Selected template is not schedulable');
    }

    requireTargetValue(input.targetType, input.targetValue);

    const timezone = input.timezone?.trim() || DEFAULT_TIMEZONE;
    const status = input.status ?? NotificationCampaignStatus.ACTIVE;
    const payload = resolveNotificationPayload({
        templateKey: input.templateKey,
        title: input.title,
        body: input.body,
        url: input.url,
    });

    let nextRunAt: Date | null = null;
    if (status === NotificationCampaignStatus.ACTIVE) {
        nextRunAt = await calculateNextRunAt(input.templateKey, new Date(), timezone);
        if (!nextRunAt) {
            throw new Error('No future run date available for selected template');
        }
    }

    return prisma.notificationCampaign.create({
        data: {
            type: NotificationCampaignType.SCHEDULED,
            templateKey: input.templateKey,
            title: payload.title,
            body: payload.body,
            url: payload.url,
            targetType: input.targetType,
            targetValue: input.targetValue || null,
            status,
            timezone,
            nextRunAt,
            createdById: input.createdById,
        },
        include: {
            createdBy: {
                select: {
                    id: true,
                    email: true,
                },
            },
        },
    });
}

export async function listNotificationCampaigns() {
    const campaigns = await prisma.notificationCampaign.findMany({
        orderBy: {
            createdAt: 'desc',
        },
        include: {
            createdBy: {
                select: {
                    id: true,
                    email: true,
                    player: {
                        select: {
                            name: true,
                        },
                    },
                },
            },
            dispatches: {
                orderBy: {
                    runAt: 'desc',
                },
                take: 10,
            },
        },
    });

    const aggregates = await prisma.notificationDispatch.groupBy({
        by: ['campaignId'],
        _sum: {
            sent: true,
            failed: true,
        },
        _count: {
            campaignId: true,
        },
    });

    const aggregateByCampaign = new Map(
        aggregates.map((entry) => [
            entry.campaignId,
            {
                totalSent: entry._sum.sent || 0,
                totalFailed: entry._sum.failed || 0,
                totalRuns: entry._count.campaignId,
            },
        ])
    );

    return campaigns.map((campaign) => ({
        ...campaign,
        metrics: aggregateByCampaign.get(campaign.id) || {
            totalSent: 0,
            totalFailed: 0,
            totalRuns: 0,
        },
    }));
}

export async function updateScheduledCampaign(campaignId: string, updates: UpdateScheduledInput) {
    const existing = await prisma.notificationCampaign.findUnique({
        where: { id: campaignId },
    });

    if (!existing) {
        throw new Error('Campaign not found');
    }

    if (existing.type !== NotificationCampaignType.SCHEDULED) {
        throw new Error('Only scheduled campaigns can be updated');
    }

    const templateKey = updates.templateKey || existing.templateKey;
    const template = getTemplateDefinition(templateKey);
    if (template.category !== 'SCHEDULED') {
        throw new Error('Selected template is not schedulable');
    }

    const targetType = updates.targetType || existing.targetType;
    const targetValue = updates.targetValue === undefined ? existing.targetValue : updates.targetValue;
    requireTargetValue(targetType, targetValue);

    const payload = resolveNotificationPayload({
        templateKey,
        title: updates.title ?? existing.title,
        body: updates.body ?? existing.body,
        url: updates.url ?? existing.url,
    });

    const timezone = updates.timezone || existing.timezone || DEFAULT_TIMEZONE;
    let status = updates.status || existing.status;
    let nextRunAt = updates.nextRunAt === undefined ? existing.nextRunAt : updates.nextRunAt;

    if (status === NotificationCampaignStatus.ACTIVE) {
        if (!nextRunAt || nextRunAt <= new Date()) {
            nextRunAt = await calculateNextRunAt(templateKey, new Date(), timezone);
        }
        if (!nextRunAt) {
            throw new Error('No future run date available for selected template');
        }
    }

    if (status === NotificationCampaignStatus.PAUSED) {
        nextRunAt = null;
    }

    if (
        status !== NotificationCampaignStatus.ACTIVE &&
        status !== NotificationCampaignStatus.PAUSED &&
        status !== NotificationCampaignStatus.FAILED
    ) {
        status = NotificationCampaignStatus.PAUSED;
    }

    return prisma.notificationCampaign.update({
        where: { id: campaignId },
        data: {
            templateKey,
            title: payload.title,
            body: payload.body,
            url: payload.url,
            targetType,
            targetValue,
            timezone,
            status,
            nextRunAt,
            processingToken: null,
            processingAt: null,
            lastError: status === NotificationCampaignStatus.ACTIVE ? null : existing.lastError,
        },
    });
}

export async function deleteScheduledCampaign(campaignId: string) {
    const existing = await prisma.notificationCampaign.findUnique({
        where: { id: campaignId },
    });

    if (!existing) {
        throw new Error('Campaign not found');
    }

    if (existing.type !== NotificationCampaignType.SCHEDULED) {
        throw new Error('Only scheduled campaigns can be deleted from this endpoint');
    }

    await prisma.notificationCampaign.delete({
        where: { id: campaignId },
    });
}

export async function processDueNotificationCampaigns(maxRuns = 10) {
    let processed = 0;
    for (let i = 0; i < maxRuns; i++) {
        const claimed = await claimDueCampaign();
        if (!claimed) break;

        processed++;
        await runClaimedCampaign(claimed);
    }

    return processed;
}

async function claimDueCampaign() {
    const now = new Date();
    const staleLockTime = new Date(now.getTime() - STALE_LOCK_MS);

    const candidate = await prisma.notificationCampaign.findFirst({
        where: {
            type: NotificationCampaignType.SCHEDULED,
            nextRunAt: {
                lte: now,
            },
            OR: [
                { status: NotificationCampaignStatus.ACTIVE },
                {
                    status: NotificationCampaignStatus.RUNNING,
                    processingAt: {
                        lt: staleLockTime,
                    },
                },
            ],
        },
        orderBy: {
            nextRunAt: 'asc',
        },
    });

    if (!candidate || !candidate.nextRunAt) {
        return null;
    }

    const token = `run-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const claimed = await prisma.notificationCampaign.updateMany({
        where: {
            id: candidate.id,
            nextRunAt: candidate.nextRunAt,
            OR: [
                { status: NotificationCampaignStatus.ACTIVE },
                {
                    status: NotificationCampaignStatus.RUNNING,
                    processingAt: {
                        lt: staleLockTime,
                    },
                },
            ],
        },
        data: {
            status: NotificationCampaignStatus.RUNNING,
            processingToken: token,
            processingAt: now,
            lastError: null,
        },
    });

    if (claimed.count === 0) {
        return null;
    }

    const campaign = await prisma.notificationCampaign.findUnique({
        where: { id: candidate.id },
    });

    if (!campaign || campaign.processingToken !== token || !campaign.nextRunAt) {
        return null;
    }

    return {
        ...campaign,
        nextRunAt: campaign.nextRunAt!,
    };
}

async function runClaimedCampaign(campaign: {
    id: string;
    templateKey: NotificationTemplateKey;
    title: string;
    body: string;
    url: string | null;
    targetType: NotificationTargetType;
    targetValue: string | null;
    timezone: string;
    nextRunAt: Date;
}) {
    try {
        requireTargetValue(campaign.targetType, campaign.targetValue);

        const payload = resolveNotificationPayload({
            templateKey: campaign.templateKey,
            title: campaign.title,
            body: campaign.body,
            url: campaign.url,
            runAt: campaign.nextRunAt,
        });

        const target = toPushTarget(campaign.targetType, campaign.targetValue);
        const result = await sendPushByTarget(target, payload);

        await prisma.notificationDispatch.upsert({
            where: {
                campaignId_runAt: {
                    campaignId: campaign.id,
                    runAt: campaign.nextRunAt,
                },
            },
            update: {
                sent: result.sent,
                failed: result.failed,
                errorSummary: result.failed > 0 ? `Failed deliveries: ${result.failed}` : null,
            },
            create: {
                campaignId: campaign.id,
                runAt: campaign.nextRunAt,
                sent: result.sent,
                failed: result.failed,
                errorSummary: result.failed > 0 ? `Failed deliveries: ${result.failed}` : null,
            },
        });

        const nextRunAt = await calculateNextRunAt(
            campaign.templateKey,
            new Date(campaign.nextRunAt.getTime() + 60_000),
            campaign.timezone || DEFAULT_TIMEZONE
        );

        await prisma.notificationCampaign.update({
            where: { id: campaign.id },
            data: {
                status: nextRunAt ? NotificationCampaignStatus.ACTIVE : NotificationCampaignStatus.COMPLETED,
                lastRunAt: campaign.nextRunAt,
                nextRunAt,
                processingToken: null,
                processingAt: null,
                lastError: result.failed > 0 ? `Failed deliveries: ${result.failed}` : null,
            },
        });
    } catch (error: any) {
        const message = error?.message || 'Unknown scheduler error';
        logger.error({ campaignId: campaign.id, error }, 'Scheduled notification campaign failed');
        await prisma.notificationCampaign.update({
            where: { id: campaign.id },
            data: {
                status: NotificationCampaignStatus.FAILED,
                processingToken: null,
                processingAt: null,
                lastError: message,
            },
        });
    }
}

async function calculateNextRunAt(
    templateKey: NotificationTemplateKey,
    fromDate: Date,
    timezone: string
): Promise<Date | null> {
    switch (templateKey) {
        case 'SEASON_START':
            return calculateSeasonStartRun(fromDate, timezone);
        case 'SEASON_END_REMINDER':
            return calculateSeasonEndReminderRun(fromDate, timezone);
        case 'WEEKLY_PENDING_MATCH_REMINDER':
            return calculateNextWeeklyMondayRun(fromDate, timezone, 19, 0);
        case 'TOURNAMENT_REGISTRATION_DEADLINE_REMINDER':
            return calculateTournamentReminderRun(fromDate, timezone);
        case 'SEASON_END_SUMMARY':
            return calculateSeasonEndSummaryRun(fromDate, timezone);
        default:
            return null;
    }
}

async function calculateSeasonStartRun(fromDate: Date, timezone: string) {
    const seasons = await prisma.season.findMany({
        where: {
            endDate: {
                gte: new Date(fromDate.getTime() - 14 * 24 * 60 * 60 * 1000),
            },
        },
        orderBy: {
            startDate: 'asc',
        },
    });

    for (const season of seasons) {
        const candidate = zonedDateFromReference(season.startDate, timezone, 9, 0);
        if (candidate > fromDate) return candidate;
    }
    return null;
}

async function calculateSeasonEndReminderRun(fromDate: Date, timezone: string) {
    const seasons = await prisma.season.findMany({
        where: {
            endDate: {
                gte: new Date(fromDate.getTime() - 14 * 24 * 60 * 60 * 1000),
            },
        },
        orderBy: {
            endDate: 'asc',
        },
    });

    for (const season of seasons) {
        const base = new Date(season.endDate);
        const reminderDays = [14, 7, 2];
        for (const days of reminderDays) {
            const reference = new Date(base);
            reference.setUTCDate(reference.getUTCDate() - days);
            const candidate = zonedDateFromReference(reference, timezone, 9, 0);
            if (candidate > fromDate) return candidate;
        }
    }
    return null;
}

async function calculateTournamentReminderRun(fromDate: Date, timezone: string) {
    const seasons = await prisma.season.findMany({
        where: {
            startDate: {
                gte: new Date(fromDate.getTime() - 7 * 24 * 60 * 60 * 1000),
            },
        },
        orderBy: {
            startDate: 'asc',
        },
    });

    for (const season of seasons) {
        const reference = new Date(season.startDate);
        reference.setUTCDate(reference.getUTCDate() - 3);
        const candidate = zonedDateFromReference(reference, timezone, 9, 0);
        if (candidate > fromDate) return candidate;
    }
    return null;
}

async function calculateSeasonEndSummaryRun(fromDate: Date, timezone: string) {
    const seasons = await prisma.season.findMany({
        where: {
            endDate: {
                gte: new Date(fromDate.getTime() - 2 * 24 * 60 * 60 * 1000),
            },
        },
        orderBy: {
            endDate: 'asc',
        },
    });

    for (const season of seasons) {
        const candidate = zonedDateFromReference(season.endDate, timezone, 21, 0);
        if (candidate > fromDate) return candidate;
    }
    return null;
}

function calculateNextWeeklyMondayRun(fromDate: Date, timezone: string, hour: number, minute: number) {
    const parts = getDatePartsInTimeZone(fromDate, timezone);
    const currentDay = parts.weekday;

    let daysToAdd = (1 - currentDay + 7) % 7;
    if (daysToAdd === 0) {
        const todayCandidate = zonedDateTimeToUtc(parts.year, parts.month, parts.day, hour, minute, timezone);
        if (todayCandidate > fromDate) {
            return todayCandidate;
        }
        daysToAdd = 7;
    }

    const reference = zonedDateTimeToUtc(parts.year, parts.month, parts.day, 12, 0, timezone);
    reference.setUTCDate(reference.getUTCDate() + daysToAdd);
    const nextParts = getDatePartsInTimeZone(reference, timezone);
    return zonedDateTimeToUtc(nextParts.year, nextParts.month, nextParts.day, hour, minute, timezone);
}

function zonedDateFromReference(referenceDate: Date, timezone: string, hour: number, minute: number) {
    const parts = getDatePartsInTimeZone(referenceDate, timezone);
    return zonedDateTimeToUtc(parts.year, parts.month, parts.day, hour, minute, timezone);
}

function getDatePartsInTimeZone(date: Date, timezone: string) {
    const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        weekday: 'short',
    });

    const parts = formatter.formatToParts(date);
    const get = (type: string) => parts.find((p) => p.type === type)?.value || '0';
    const weekdayText = get('weekday').toLowerCase();
    const weekdayMap: Record<string, number> = {
        sun: 0,
        mon: 1,
        tue: 2,
        wed: 3,
        thu: 4,
        fri: 5,
        sat: 6,
    };

    return {
        year: Number(get('year')),
        month: Number(get('month')),
        day: Number(get('day')),
        hour: Number(get('hour')),
        minute: Number(get('minute')),
        second: Number(get('second')),
        weekday: weekdayMap[weekdayText.slice(0, 3)] ?? 0,
    };
}

function getTimeZoneOffsetMilliseconds(date: Date, timezone: string) {
    const parts = getDatePartsInTimeZone(date, timezone);
    const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
    return asUtc - date.getTime();
}

function zonedDateTimeToUtc(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    timezone: string
) {
    const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
    const offset1 = getTimeZoneOffsetMilliseconds(utcGuess, timezone);
    const corrected = new Date(utcGuess.getTime() - offset1);
    const offset2 = getTimeZoneOffsetMilliseconds(corrected, timezone);
    if (offset1 === offset2) {
        return corrected;
    }
    return new Date(utcGuess.getTime() - offset2);
}

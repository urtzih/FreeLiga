import {
    NotificationCampaignStatus,
    NotificationTargetType,
    Role,
    prisma,
} from '@freesquash/database';
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
    createScheduledCampaign,
    deleteScheduledCampaign,
    getNotificationTemplateKeys,
    isNotificationTemplateKey,
    listNotificationCampaigns,
    listNotificationTemplates,
    sendNowCampaign,
    updateScheduledCampaign,
} from '../services/notification-campaign.service';

declare module 'fastify' {
    interface FastifyInstance {
        authenticate: (request: any, reply: any) => Promise<void>;
    }
}

const targetTypeSchema = z.nativeEnum(NotificationTargetType);
const templateKeySchema = z
    .string()
    .min(1)
    .refine((value) => isNotificationTemplateKey(value), {
        message: `Invalid templateKey. Allowed values: ${getNotificationTemplateKeys().join(', ')}`,
    });

const sendNowSchema = z.object({
    templateKey: templateKeySchema,
    title: z.string().min(1).max(160).optional(),
    body: z.string().min(1).max(1000).optional(),
    url: z.string().max(500).optional(),
    targetType: targetTypeSchema,
    targetValue: z.string().optional(),
});

const createScheduledSchema = z.object({
    templateKey: templateKeySchema,
    title: z.string().min(1).max(160).optional(),
    body: z.string().min(1).max(1000).optional(),
    url: z.string().max(500).optional(),
    targetType: targetTypeSchema,
    targetValue: z.string().optional(),
    timezone: z.string().min(1).max(120).optional(),
    status: z
        .enum([NotificationCampaignStatus.ACTIVE, NotificationCampaignStatus.PAUSED])
        .optional(),
});

const patchScheduledSchema = z.object({
    templateKey: templateKeySchema.optional(),
    title: z.string().min(1).max(160).optional(),
    body: z.string().min(1).max(1000).optional(),
    url: z.string().max(500).nullable().optional(),
    targetType: targetTypeSchema.optional(),
    targetValue: z.string().nullable().optional(),
    timezone: z.string().min(1).max(120).optional(),
    status: z
        .enum([
            NotificationCampaignStatus.ACTIVE,
            NotificationCampaignStatus.PAUSED,
            NotificationCampaignStatus.FAILED,
        ])
        .optional(),
    nextRunAt: z.string().datetime().nullable().optional(),
});

function ensureAdmin(request: any, reply: any): { id: string; role: Role } | null {
    const user = request.user as { id: string; role: Role };
    if (user.role !== Role.ADMIN) {
        reply.status(403).send({ error: 'Forbidden' });
        return null;
    }
    return user;
}

export async function notificationAdminRoutes(fastify: FastifyInstance) {
    fastify.get('/notifications/templates', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        const user = ensureAdmin(request, reply);
        if (!user) return;

        const templates = listNotificationTemplates();
        return { templates };
    });

    fastify.get('/notifications/targets', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        const user = ensureAdmin(request, reply);
        if (!user) return;

        const query = z
            .object({
                search: z.string().optional(),
            })
            .parse(request.query || {});

        const now = new Date();
        const activeSeason = await prisma.season.findFirst({
            where: {
                startDate: { lte: now },
                endDate: { gte: now },
            },
            orderBy: {
                startDate: 'desc',
            },
        });

        const fallbackSeason = !activeSeason
            ? await prisma.season.findFirst({
                  orderBy: { startDate: 'desc' },
              })
            : null;
        const seasonId = activeSeason?.id || fallbackSeason?.id || null;

        const groups = seasonId
            ? await prisma.group.findMany({
                  where: { seasonId },
                  orderBy: { name: 'asc' },
                  select: {
                      id: true,
                      name: true,
                      season: {
                          select: {
                              id: true,
                              name: true,
                          },
                      },
                  },
              })
            : [];

        const whereUsers: any = {
            role: Role.PLAYER,
            isActive: true,
            player: {
                isNot: null,
            },
        };

        if (query.search) {
            whereUsers.OR = [
                { email: { contains: query.search } },
                { player: { name: { contains: query.search } } },
                { player: { nickname: { contains: query.search } } },
            ];
        }

        const users = await prisma.user.findMany({
            where: whereUsers,
            take: 250,
            orderBy: {
                createdAt: 'desc',
            },
            select: {
                id: true,
                email: true,
                player: {
                    select: {
                        id: true,
                        name: true,
                        nickname: true,
                        groupPlayers: seasonId
                            ? {
                                  where: {
                                      group: { seasonId },
                                  },
                                  take: 1,
                                  select: {
                                      group: {
                                          select: {
                                              id: true,
                                              name: true,
                                          },
                                      },
                                  },
                              }
                            : {
                                  take: 1,
                                  select: {
                                      group: {
                                          select: {
                                              id: true,
                                              name: true,
                                          },
                                      },
                                  },
                              },
                    },
                },
            },
        });

        return {
            groups,
            users: users.map((entry) => ({
                id: entry.id,
                email: entry.email,
                player: entry.player
                    ? {
                          id: entry.player.id,
                          name: entry.player.name,
                          nickname: entry.player.nickname,
                          currentGroup: entry.player.groupPlayers[0]?.group || null,
                      }
                    : null,
            })),
        };
    });

    fastify.get('/notifications/campaigns', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        const user = ensureAdmin(request, reply);
        if (!user) return;

        const campaigns = await listNotificationCampaigns();
        return { campaigns };
    });

    fastify.post('/notifications/send-now', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        const user = ensureAdmin(request, reply);
        if (!user) return;

        try {
            const body = sendNowSchema.parse(request.body);
            const result = await sendNowCampaign({
                ...body,
                createdById: user.id,
            });
            return {
                success: true,
                message: 'Notification sent',
                result,
            };
        } catch (error: any) {
            return reply.status(400).send({
                error: error?.message || 'Unable to send notification',
            });
        }
    });

    fastify.post('/notifications/campaigns', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        const user = ensureAdmin(request, reply);
        if (!user) return;

        try {
            const body = createScheduledSchema.parse(request.body);
            const campaign = await createScheduledCampaign({
                ...body,
                createdById: user.id,
            });
            return {
                success: true,
                campaign,
            };
        } catch (error: any) {
            return reply.status(400).send({
                error: error?.message || 'Unable to create scheduled campaign',
            });
        }
    });

    fastify.patch('/notifications/campaigns/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        const user = ensureAdmin(request, reply);
        if (!user) return;

        try {
            const params = z.object({ id: z.string() }).parse(request.params);
            const body = patchScheduledSchema.parse(request.body);
            const campaign = await updateScheduledCampaign(params.id, {
                ...body,
                nextRunAt: body.nextRunAt === undefined ? undefined : body.nextRunAt ? new Date(body.nextRunAt) : null,
            });
            return {
                success: true,
                campaign,
            };
        } catch (error: any) {
            if (error?.message === 'Campaign not found') {
                return reply.status(404).send({ error: error.message });
            }
            return reply.status(400).send({
                error: error?.message || 'Unable to update campaign',
            });
        }
    });

    fastify.delete('/notifications/campaigns/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
        const user = ensureAdmin(request, reply);
        if (!user) return;

        try {
            const params = z.object({ id: z.string() }).parse(request.params);
            await deleteScheduledCampaign(params.id);
            return {
                success: true,
            };
        } catch (error: any) {
            if (error?.message === 'Campaign not found') {
                return reply.status(404).send({ error: error.message });
            }
            return reply.status(400).send({
                error: error?.message || 'Unable to delete campaign',
            });
        }
    });
}

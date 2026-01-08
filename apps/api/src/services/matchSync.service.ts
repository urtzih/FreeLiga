import { prisma } from '@freesquash/database';
import { GoogleCalendarService } from './googleCalendar.service';
import { logger } from '../utils/logger';

export class MatchSyncService {
    /**
     * Sincronizar partido a Google Calendar
     */
    static async syncMatchToGoogleCalendar(matchId: string, userId: string) {
        try {
            const match = await prisma.match.findUnique({
                where: { id: matchId },
                include: {
                    player1: {
                        include: {
                            user: true,
                        },
                    },
                    player2: {
                        include: {
                            user: true,
                        },
                    },
                    group: true,
                },
            });

            if (!match || !match.scheduledDate || !match.location) {
                logger.warn({ matchId }, 'Match missing required fields for Google Calendar sync');
                return null;
            }

            const endTime = new Date(match.scheduledDate.getTime() + 90 * 60000);

            const eventData = {
                summary: `${match.player1.name} vs ${match.player2.name}`,
                description: `Partido del grupo: ${match.group.name}\n\nLugar: ${match.location}`,
                start: match.scheduledDate,
                end: endTime,
                location: match.location,
                attendees: [
                    match.player1.user?.email && { email: match.player1.user.email, displayName: match.player1.name },
                    match.player2.user?.email && { email: match.player2.user.email, displayName: match.player2.name },
                ].filter((a): a is { email: string; displayName: string } => !!a),
            };

            const googleEvent = await GoogleCalendarService.createCalendarEvent(userId, eventData);

            logger.info({ 
                matchId, 
                googleEventId: googleEvent.id,
                eventLink: googleEvent.htmlLink,
                eventSummary: eventData.summary,
                eventStart: eventData.start,
                calendarId: googleEvent.organizer?.email || 'primary'
            }, '✅ Match synced to Google Calendar successfully');

            const updatedMatch = await prisma.match.update({
                where: { id: matchId },
                data: {
                    googleEventId: googleEvent.id!,
                    googleCalendarSyncStatus: 'SYNCED',
                    isScheduled: true,
                },
            });

            logger.info({ matchId, googleEventId: googleEvent.id }, 'Match synced to Google Calendar');
            return updatedMatch;
        } catch (error) {
            logger.error({ error, matchId }, 'Failed to sync match to Google Calendar');
            
            await prisma.match.update({
                where: { id: matchId },
                data: {
                    googleCalendarSyncStatus: 'FAILED',
                },
            }).catch(e => logger.error({ e }, 'Failed to update sync status'));

            throw error;
        }
    }

    /**
     * Actualizar partido en Google Calendar
     */
    static async updateMatchInGoogleCalendar(matchId: string, userId: string) {
        try {
            const match = await prisma.match.findUnique({
                where: { id: matchId },
                include: {
                    player1: {
                        include: {
                            user: true,
                        },
                    },
                    player2: {
                        include: {
                            user: true,
                        },
                    },
                    group: true,
                },
            });

            if (!match || !match.googleEventId) {
                logger.warn({ matchId }, 'Match has no Google Calendar event');
                return null;
            }

            const endTime = match.scheduledDate 
                ? new Date(match.scheduledDate.getTime() + 90 * 60000)
                : undefined;

            const eventData = {
                summary: `${match.player1.name} vs ${match.player2.name}`,
                description: `Partido del grupo: ${match.group.name}\n\nLugar: ${match.location || ''}`,
                start: match.scheduledDate || undefined,
                end: endTime,
                location: match.location || undefined,
            };

            await GoogleCalendarService.updateCalendarEvent(userId, match.googleEventId, eventData);

            const updatedMatch = await prisma.match.update({
                where: { id: matchId },
                data: {
                    googleCalendarSyncStatus: 'SYNCED',
                },
            });

            logger.info({ matchId, googleEventId: match.googleEventId }, 'Match updated in Google Calendar');
            return updatedMatch;
        } catch (error) {
            logger.error({ error, matchId }, 'Failed to update match in Google Calendar');
            
            await prisma.match.update({
                where: { id: matchId },
                data: {
                    googleCalendarSyncStatus: 'FAILED',
                },
            }).catch(e => logger.error({ e }, 'Failed to update sync status'));

            throw error;
        }
    }

    /**
     * Eliminar partido de Google Calendar
     */
    static async deleteMatchFromGoogleCalendar(matchId: string, userId: string) {
        try {
            const match = await prisma.match.findUnique({
                where: { id: matchId },
            });

            if (!match || !match.googleEventId) {
                logger.warn({ matchId }, 'Match has no Google Calendar event');
                return null;
            }

            await GoogleCalendarService.deleteCalendarEvent(userId, match.googleEventId);
            logger.info({ matchId }, 'Match deleted from Google Calendar');
        } catch (error) {
            logger.error({ error, matchId }, 'Failed to delete match from Google Calendar');
        }
    }
}

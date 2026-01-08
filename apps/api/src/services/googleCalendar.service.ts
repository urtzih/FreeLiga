import { google } from 'googleapis';
import { prisma } from '@freesquash/database';
import { logger } from '../utils/logger';

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

export interface CalendarEventData {
    summary: string;
    description?: string;
    start: Date;
    end: Date;
    location?: string;
    attendees?: Array<{ email: string; displayName?: string }>;
}

export class GoogleCalendarService {
    /**
     * Obtener URL para iniciar OAuth
     */
    static getAuthUrl(state?: string) {
        const scopes = [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events',
        ];

        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            state: state || '',
            prompt: 'consent',
        });

        return url;
    }

    /**
     * Intercambiar código de autorización por tokens
     */
    static async exchangeCodeForTokens(code: string) {
        try {
            const { tokens } = await oauth2Client.getToken(code);
            logger.info('Successfully exchanged auth code for tokens');
            return tokens;
        } catch (error) {
            logger.error({ error }, 'Failed to exchange auth code for tokens');
            throw error;
        }
    }

    /**
     * Guardar integración de Google Calendar para un usuario
     */
    static async saveIntegration(userId: string, tokens: any, calendarId: string = 'primary') {
        try {
            const expiresAt = tokens.expiry_date 
                ? new Date(tokens.expiry_date) 
                : new Date(Date.now() + 3600 * 1000);

            const integration = await prisma.googleCalendarToken.upsert({
                where: { userId },
                update: {
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token || '',
                    expiresAt,
                    updatedAt: new Date(),
                },
                create: {
                    userId,
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token || '',
                    expiresAt,
                },
            });

            logger.info({ userId }, 'Google Calendar integration saved');
            return integration;
        } catch (error) {
            logger.error({ error, userId }, 'Failed to save Google Calendar integration');
            throw error;
        }
    }

    /**
     * Obtener integración de un usuario
     */
    static async getIntegration(userId: string) {
        return await prisma.googleCalendarToken.findUnique({
            where: { userId },
        });
    }

    /**
     * Refrescar token si ha expirado
     */
    static async refreshTokenIfNeeded(integration: any) {
        const now = new Date();
        if (integration.expiresAt > now) {
            return integration;
        }

        try {
            oauth2Client.setCredentials({
                refresh_token: integration.refreshToken,
            });

            const { credentials } = await oauth2Client.refreshAccessToken();
            
            const updated = await prisma.googleCalendarToken.update({
                where: { userId: integration.userId },
                data: {
                    accessToken: credentials.access_token!,
                    expiresAt: new Date(credentials.expiry_date!),
                },
            });

            logger.info({ userId: integration.userId }, 'Token refreshed successfully');
            return updated;
        } catch (error) {
            logger.error({ error, userId: integration.userId }, 'Failed to refresh token');
            throw error;
        }
    }

    /**
     * Crear evento en Google Calendar
     */
    static async createCalendarEvent(userId: string, eventData: CalendarEventData) {
        try {
            let integration = await this.getIntegration(userId);
            if (!integration) {
                throw new Error('User has not connected Google Calendar');
            }

            integration = await this.refreshTokenIfNeeded(integration);

            if (!integration) {
                throw new Error('Integration lost after token refresh');
            }

            oauth2Client.setCredentials({
                access_token: integration.accessToken,
            });

            const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

            const event = {
                summary: eventData.summary,
                description: eventData.description || '',
                start: {
                    dateTime: eventData.start.toISOString(),
                    timeZone: 'Europe/Madrid',
                },
                end: {
                    dateTime: eventData.end.toISOString(),
                    timeZone: 'Europe/Madrid',
                },
                location: eventData.location || '',
                attendees: eventData.attendees || [],
                visibility: 'public' as const,
            };

            const response = await calendar.events.insert({
                calendarId: integration.calendarId,
                requestBody: event,
                sendUpdates: 'all',
            });

            logger.info({ userId, eventId: response.data.id }, 'Calendar event created');
            return response.data;
        } catch (error) {
            logger.error({ error, userId }, 'Failed to create calendar event');
            throw error;
        }
    }

    /**
     * Actualizar evento en Google Calendar
     */
    static async updateCalendarEvent(userId: string, googleEventId: string, eventData: Partial<CalendarEventData>) {
        try {
            let integration = await this.getIntegration(userId);
            if (!integration) {
                throw new Error('User has not connected Google Calendar');
            }

            integration = await this.refreshTokenIfNeeded(integration);

            if (!integration) {
                throw new Error('Integration lost after token refresh');
            }

            oauth2Client.setCredentials({
                access_token: integration.accessToken,
            });

            const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

            const currentEvent = await calendar.events.get({
                calendarId: integration.calendarId,
                eventId: googleEventId,
            });

            const updatedEvent = {
                ...currentEvent.data,
                summary: eventData.summary || currentEvent.data.summary,
                description: eventData.description !== undefined ? eventData.description : currentEvent.data.description,
                location: eventData.location !== undefined ? eventData.location : currentEvent.data.location,
                attendees: eventData.attendees || currentEvent.data.attendees,
            } as any;

            if (eventData.start) {
                updatedEvent.start = {
                    dateTime: eventData.start.toISOString(),
                    timeZone: 'Europe/Madrid',
                };
            }

            if (eventData.end) {
                updatedEvent.end = {
                    dateTime: eventData.end.toISOString(),
                    timeZone: 'Europe/Madrid',
                };
            }

            const response = await calendar.events.update({
                calendarId: integration.calendarId,
                eventId: googleEventId,
                requestBody: updatedEvent,
                sendUpdates: 'all',
            });

            logger.info({ userId, eventId: googleEventId }, 'Calendar event updated');
            return response.data;
        } catch (error) {
            logger.error({ error, userId, googleEventId }, 'Failed to update calendar event');
            throw error;
        }
    }

    /**
     * Eliminar evento de Google Calendar
     */
    static async deleteCalendarEvent(userId: string, googleEventId: string) {
        try {
            let integration = await this.getIntegration(userId);
            if (!integration) {
                throw new Error('User has not connected Google Calendar');
            }

            integration = await this.refreshTokenIfNeeded(integration);

            if (!integration) {
                throw new Error('Integration lost after token refresh');
            }

            oauth2Client.setCredentials({
                access_token: integration.accessToken,
            });

            const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

            await calendar.events.delete({
                calendarId: integration.calendarId,
                eventId: googleEventId,
                sendUpdates: 'all',
            });

            logger.info({ userId, eventId: googleEventId }, 'Calendar event deleted');
        } catch (error) {
            logger.error({ error, userId, googleEventId }, 'Failed to delete calendar event');
            throw error;
        }
    }
}

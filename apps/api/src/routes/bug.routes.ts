import { FastifyInstance } from 'fastify';
import { prisma } from '@freesquash/database';
import { z } from 'zod';

const createBugSchema = z.object({
  description: z.string().min(5),
  email: z.string().email().optional(),
  userAgent: z.string().optional(),
  appVersion: z.string().optional(),
  attachments: z.string().optional()
});

export async function bugRoutes(fastify: FastifyInstance) {
  // Crear bug (usuario autenticado o anónimo si se amplía en futuro)
  fastify.post('/', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      const body = createBugSchema.parse(request.body);

      const bug = await prisma.bugReport.create({
        data: {
          description: body.description,
          email: body.email || decoded?.email,
          userAgent: body.userAgent,
          appVersion: body.appVersion,
          attachments: body.attachments,
          userId: decoded?.id || null,
        }
      });

      return bug;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      // Log detailed error for debugging
      fastify.log.error({ error, errorMessage: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined }, 'Error creating bug report');
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Listado de bugs (admin)
  fastify.get('/', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      if (decoded.role !== 'ADMIN') {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      const { status } = request.query as { status?: string };
      const bugs = await prisma.bugReport.findMany({
        where: status ? { status: status as any } : {},
        include: {
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  role: true
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return bugs;
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Actualizar estado (admin)
  fastify.put('/:id/status', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      if (decoded.role !== 'ADMIN') {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      const { id } = request.params as { id: string };
      const body = z.object({ status: z.enum(['OPEN', 'ACK', 'CLOSED']) }).parse(request.body);

      const updated = await prisma.bugReport.update({
        where: { id },
        data: { status: body.status }
      });

      return updated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Delete bug (admin)
  fastify.delete('/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      if (decoded.role !== 'ADMIN') {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      const { id } = request.params as { id: string };
      await prisma.bugReport.delete({ where: { id } });

      return { success: true };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Add comment to bug (admin)
  fastify.post('/:id/comments', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      if (decoded.role !== 'ADMIN') {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      const { id } = request.params as { id: string };
      const body = z.object({ comment: z.string().min(1) }).parse(request.body);

      const comment = await prisma.bugComment.create({
        data: {
          bugId: id,
          userId: decoded.id,
          comment: body.comment
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true
            }
          }
        }
      });

      return comment;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: error.errors });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get comments for a bug (admin)
  fastify.get('/:id/comments', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    try {
      const decoded = request.user as any;
      if (decoded.role !== 'ADMIN') {
        return reply.status(403).send({ error: 'Forbidden' });
      }

      const { id } = request.params as { id: string };
      const comments = await prisma.bugComment.findMany({
        where: { bugId: id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      return comments;
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}

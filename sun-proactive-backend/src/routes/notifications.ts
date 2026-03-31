import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { notifications } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { authGuard, JwtPayload } from '../middleware/auth.js';

export default async function notificationsRoutes(server: FastifyInstance) {

  // ─── GET NOTIFICATIONS ───────────────────────────────────────
  server.get('/', { preHandler: [authGuard] }, async (request, reply) => {
    try {
      const user = (request as any).user as JwtPayload;

      const data = await db.select().from(notifications)
        .where(eq(notifications.userId, user.id))
        .orderBy(desc(notifications.createdAt))
        .limit(20);

      return { notifications: data };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch notifications' });
    }
  });

  // ─── MARK AS READ ────────────────────────────────────────────
  server.post('/read', { preHandler: [authGuard] }, async (request, reply) => {
    try {
      const { notificationId } = request.body as { notificationId: string };

      await db.update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, notificationId));

      return { success: true };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Failed to mark notification as read' });
    }
  });
}

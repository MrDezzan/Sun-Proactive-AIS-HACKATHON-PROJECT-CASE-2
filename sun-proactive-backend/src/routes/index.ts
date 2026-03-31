import { FastifyInstance } from 'fastify';
import authRoutes from './auth.js';
import chatRoutes from './chat.js';
import tasksRoutes from './tasks.js';
import notificationsRoutes from './notifications.js';
import adminRoutes from './admin.js';
import verifyRoutes from './verify.js';
import cronRoutes from './cron.js';
import teamRoutes from './teams.js';
import friendsRoutes from './friends.js';

export default async function apiRoutes(server: FastifyInstance) {
  server.register(authRoutes, { prefix: '/auth' });
  server.register(chatRoutes, { prefix: '/chat' });
  server.register(tasksRoutes, { prefix: '/tasks' });
  server.register(notificationsRoutes, { prefix: '/notifications' });
  server.register(adminRoutes, { prefix: '/admin' });
  server.register(verifyRoutes, { prefix: '/verify' });
  server.register(cronRoutes, { prefix: '/cron' });
  server.register(teamRoutes);
  server.register(friendsRoutes, { prefix: '/friends' });
}

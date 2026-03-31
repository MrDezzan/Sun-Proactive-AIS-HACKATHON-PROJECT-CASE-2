import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { adminGuard } from '../middleware/auth.js';
export default async function adminRoutes(server) {
    // ─── ПОЛУЧЕНИЕ СПИСКА ПОЛЬЗОВАТЕЛЕЙ (LIST USERS) ────────────
    server.get('/users', { preHandler: [adminGuard] }, async (request, reply) => {
        try {
            const allUsers = await db.select({
                id: users.id,
                email: users.email,
                role: users.role,
                isApproved: users.isApproved,
            }).from(users);
            const unapproved = allUsers.filter(u => !u.isApproved);
            const approved = allUsers.filter(u => u.isApproved);
            return { unapproved, approved };
        }
        catch (error) {
            server.log.error(error);
            return reply.status(500).send({ error: 'Failed to list users' });
        }
    });
    // ─── ОДОБРЕНИЕ / ОТКЛОНЕНИЕ ЗАЯВКИ (APPROVE / REJECT) ────────
    server.post('/approve', { preHandler: [adminGuard] }, async (request, reply) => {
        try {
            const { userId, action } = request.body;
            if (action === 'approve') {
                await db.update(users).set({ isApproved: true }).where(eq(users.id, userId));
            }
            else if (action === 'reject') {
                await db.delete(users).where(eq(users.id, userId));
            }
            else {
                return reply.status(400).send({ error: 'Invalid action. Use "approve" or "reject".' });
            }
            return { success: true, action, userId };
        }
        catch (error) {
            server.log.error(error);
            return reply.status(500).send({ error: 'Admin action failed' });
        }
    });
    // ─── ОБНОВЛЕНИЕ ДАННЫХ ПОЛЬЗОВАТЕЛЯ (UPDATE USER) ───────────
    server.put('/users/:userId', { preHandler: [adminGuard] }, async (request, reply) => {
        try {
            const { userId } = request.params;
            const { email, role } = request.body;
            const updateData = {};
            if (email)
                updateData.email = email;
            if (role)
                updateData.role = role;
            if (Object.keys(updateData).length > 0) {
                await db.update(users).set(updateData).where(eq(users.id, userId));
            }
            return { success: true };
        }
        catch (error) {
            server.log.error(error);
            return reply.status(500).send({ error: 'Failed to update user' });
        }
    });
    // ─── УДАЛЕНИЕ ПОЛЬЗОВАТЕЛЯ (DELETE USER) ────────────────────
    server.delete('/users/:userId', { preHandler: [adminGuard] }, async (request, reply) => {
        try {
            const { userId } = request.params;
            // Удаление пользователя (в SQLite желательно использовать ON DELETE CASCADE, но пока обычное удаление)
            await db.delete(users).where(eq(users.id, userId));
            return { success: true };
        }
        catch (error) {
            server.log.error(error);
            return reply.status(500).send({ error: 'Failed to delete user' });
        }
    });
    // ─── ПОЛУЧЕНИЕ ВСЕХ ЗАДАЧ (ALL TASKS) ───────────────────────
    server.get('/tasks', { preHandler: [adminGuard] }, async (request, reply) => {
        try {
            // Need to import curatorTasks, volunteers at the top, I'll assume they're exported from schema.
            // Wait, let's just require them inline to avoid messing with top imports if they are not there
            const { curatorTasks, volunteers } = await import('../db/schema.js');
            const allTasks = await db.select().from(curatorTasks);
            const allVols = await db.select({ id: volunteers.id, name: volunteers.name }).from(volunteers);
            const volMap = new Map(allVols.map(v => [v.id, v.name]));
            const enrichedTasks = allTasks.map(t => {
                return {
                    ...t,
                    completedByName: t.completedById ? (volMap.get(t.completedById) || 'Неизвестно') : null
                };
            });
            return { tasks: enrichedTasks };
        }
        catch (error) {
            server.log.error(error);
            return reply.status(500).send({ error: 'Failed to fetch all tasks' });
        }
    });
}
//# sourceMappingURL=admin.js.map
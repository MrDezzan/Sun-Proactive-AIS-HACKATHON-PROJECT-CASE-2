import { db } from '../db/index.js';
import { teams, teamMembers, teamMessages, volunteers, curatorTasks } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { authGuard } from '../middleware/auth.js';
import crypto from 'crypto';
export default async function teamRoutes(server) {
    // Создание команды
    server.post('/tasks/:taskId/teams', { preHandler: [authGuard] }, async (request, reply) => {
        try {
            const { taskId } = request.params;
            const { maxMembers } = request.body;
            const userId = request.user.id;
            if (!maxMembers || maxMembers < 2) {
                return reply.status(400).send({ error: 'Минимум 2 участника' });
            }
            // Проверка, существует ли задача
            const [taskObj] = await db.select().from(curatorTasks).where(eq(curatorTasks.id, taskId)).limit(1);
            if (!taskObj)
                return reply.status(404).send({ error: 'Задача не найдена' });
            // Проверка, что волонтер не состоит в другой команде на этой задаче
            const existingTeamMemberArr = await db
                .select({ teamId: teamMembers.teamId })
                .from(teamMembers)
                .innerJoin(teams, eq(teamMembers.teamId, teams.id))
                .where(and(eq(teams.taskId, taskId), eq(teamMembers.volunteerId, userId)))
                .limit(1);
            const existingTeamMember = existingTeamMemberArr[0];
            if (existingTeamMember) {
                return reply.status(400).send({ error: 'Вы уже в команде для этой задачи' });
            }
            const teamId = crypto.randomUUID();
            // Исполняем всё в транзакции
            await db.transaction(async (tx) => {
                await tx.insert(teams).values({
                    id: teamId,
                    taskId: taskId,
                    creatorId: userId,
                    maxMembers: maxMembers,
                });
                await tx.insert(teamMembers).values({
                    teamId: teamId,
                    volunteerId: userId,
                });
            });
            return { success: true, teamId };
        }
        catch (error) {
            server.log.error(error);
            return reply.status(500).send({ error: error.message });
        }
    });
    // Получение команд и статуса пользователя на задаче
    server.get('/tasks/:taskId/teams', { preHandler: [authGuard] }, async (request, reply) => {
        try {
            const { taskId } = request.params;
            const userId = request.user.id;
            // Получаем все команды для задачи
            const allTeams = await db.select().from(teams).where(eq(teams.taskId, taskId));
            // Данные о командах с кол-вом участников и инфой о создателе
            const teamsData = [];
            let userTeamId = null;
            for (const t of allTeams) {
                const members = await db.select().from(teamMembers).where(eq(teamMembers.teamId, t.id));
                const [creator] = await db.select({ name: volunteers.name }).from(volunteers).where(eq(volunteers.id, t.creatorId)).limit(1);
                teamsData.push({
                    id: t.id,
                    creatorName: creator?.name || 'Неизвестно',
                    maxMembers: t.maxMembers,
                    currentMembers: members.length,
                    members: members.map(m => m.volunteerId),
                });
                if (members.find(m => m.volunteerId === userId)) {
                    userTeamId = t.id;
                }
            }
            return {
                teams: teamsData,
                userTeamId: userTeamId // Если null, значит пользователь не в команде
            };
        }
        catch (error) {
            server.log.error(error);
            return reply.status(500).send({ error: error.message });
        }
    });
    // Вступление в команду
    server.post('/teams/:teamId/join', { preHandler: [authGuard] }, async (request, reply) => {
        try {
            const { teamId } = request.params;
            const userId = request.user.id;
            const [team] = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
            if (!team)
                return reply.status(404).send({ error: 'Команда не найдена' });
            // Проверка: не состоит ли пользователь уже в какой-то команде на этой задаче
            const existingArr = await db
                .select({ teamId: teamMembers.teamId })
                .from(teamMembers)
                .innerJoin(teams, eq(teamMembers.teamId, teams.id))
                .where(and(eq(teams.taskId, team.taskId), eq(teamMembers.volunteerId, userId)))
                .limit(1);
            const existing = existingArr[0];
            if (existing)
                return reply.status(400).send({ error: 'Вы уже в команде для этой задачи' });
            // Проверка лимита
            const memberCount = await db.select().from(teamMembers).where(eq(teamMembers.teamId, teamId));
            if (memberCount.length >= team.maxMembers) {
                return reply.status(400).send({ error: 'Команда заполнена' });
            }
            await db.insert(teamMembers).values({
                teamId,
                volunteerId: userId
            });
            return { success: true };
        }
        catch (error) {
            if (error.message.includes('UNIQUE constraint failed')) {
                return reply.status(400).send({ error: 'Вы уже в этой команде' });
            }
            server.log.error(error);
            return reply.status(500).send({ error: error.message });
        }
    });
    // Получение сообщений чата
    server.get('/teams/:teamId/chat', { preHandler: [authGuard] }, async (request, reply) => {
        try {
            const { teamId } = request.params;
            const userId = request.user.id;
            // Проверка доступа: пользователь должен быть в команде
            const [isMember] = await db.select().from(teamMembers).where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.volunteerId, userId))).limit(1);
            if (!isMember)
                return reply.status(403).send({ error: 'Доступ закрыт' });
            // Получаем сообщения (с именем отправителя)
            const messages = await db
                .select({
                id: teamMessages.id,
                message: teamMessages.message,
                createdAt: teamMessages.createdAt,
                senderId: teamMessages.senderId,
                senderName: volunteers.name
            })
                .from(teamMessages)
                .innerJoin(volunteers, eq(teamMessages.senderId, volunteers.id))
                .where(eq(teamMessages.teamId, teamId))
                .orderBy(teamMessages.createdAt) // старые сверху, новые снизу
            ;
            return { messages };
        }
        catch (error) {
            server.log.error(error);
            return reply.status(500).send({ error: error.message });
        }
    });
    // Отправка сообщения
    server.post('/teams/:teamId/chat', { preHandler: [authGuard] }, async (request, reply) => {
        try {
            const { teamId } = request.params;
            const { message } = request.body;
            const userId = request.user.id;
            if (!message || message.trim() === '') {
                return reply.status(400).send({ error: 'Пустое сообщение' });
            }
            // Проверка доступа
            const [isMember] = await db.select().from(teamMembers).where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.volunteerId, userId))).limit(1);
            if (!isMember)
                return reply.status(403).send({ error: 'Доступ закрыт' });
            const msgId = crypto.randomUUID();
            await db.insert(teamMessages).values({
                id: msgId,
                teamId,
                senderId: userId,
                message: message.trim()
            });
            return { success: true, messageId: msgId };
        }
        catch (error) {
            server.log.error(error);
            return reply.status(500).send({ error: error.message });
        }
    });
}
//# sourceMappingURL=teams.js.map
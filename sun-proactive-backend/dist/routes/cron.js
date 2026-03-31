import { db } from '../db/index.js';
import { curatorTasks, volunteers, notifications } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { cosineSimilarity } from '../services/vector.js';
import { v4 as uuidv4 } from 'uuid';
export default async function cronRoutes(server) {
    // ─── CRON: АВТОНОМНЫЙ МЕНЕДЖЕР ЗАДАЧ ─────────────────────────
    // Защищено заголовком CRON_SECRET вместо JWT (для внешних планировщиков)
    server.get('/manager', async (request, reply) => {
        try {
            const cronSecret = request.headers['x-cron-secret'];
            if (cronSecret !== process.env.CRON_SECRET) {
                return reply.status(403).send({ error: 'Invalid cron secret' });
            }
            const tasks = await db.select().from(curatorTasks).where(eq(curatorTasks.status, 'open'));
            const allVols = await db.select().from(volunteers);
            let actionsTaken = 0;
            const now = new Date();
            for (const task of tasks) {
                if (!task.date)
                    continue;
                const timeDiff = task.date.getTime() - now.getTime();
                const hoursLeft = timeDiff / (1000 * 3600);
                if (hoursLeft > 0 && hoursLeft <= 24) {
                    let bestMatch = null;
                    let highestScore = 0;
                    for (const vol of allVols) {
                        const score = cosineSimilarity(task.taskEmbedding, vol.profileEmbedding);
                        if (score > highestScore) {
                            highestScore = score;
                            bestMatch = vol;
                        }
                    }
                    if (bestMatch && highestScore > 0.6) {
                        const reasonMsg = `🔥 ИИ-Менеджер: Горит дедлайн! Нам срочно нужен человек на задачу '${task.title}'. Твои навыки отлично подходят!`;
                        await db.insert(notifications).values({
                            id: uuidv4(),
                            userId: bestMatch.id,
                            message: reasonMsg,
                            link: `/volunteer/${task.id}`
                        });
                        actionsTaken++;
                    }
                }
            }
            return {
                success: true,
                message: 'Autonomous task scan complete.',
                notificationsSent: actionsTaken
            };
        }
        catch (error) {
            server.log.error(error);
            return reply.status(500).send({ error: 'Cron execution failed' });
        }
    });
}
//# sourceMappingURL=cron.js.map
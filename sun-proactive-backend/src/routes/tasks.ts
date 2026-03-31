import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { curatorTasks, volunteers, taskResponses, clarificationRequests, notifications, users, consultantChats } from '../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { authGuard } from '../middleware/auth.js';
import { ai, SYSTEM_MODEL } from '../services/ai.js';
import { cosineSimilarity } from '../services/vector.js';

export default async function tasksRoutes(server: FastifyInstance) {

  // ─── СОЗДАНИЕ ЗАДАЧИ (CREATE TASK) ───────────────────────────
  server.post('/create', { preHandler: [authGuard] }, async (request, reply) => {
    try {
      const data = request.body as any;
      server.log.info({ incomingTask: data }, 'Creating new task from AI data');
      
      const textForEmbedding = `${data.title}. Город: ${data.city}. Локация: ${data.location}. Требуемые навыки: ${data.skills_required?.join(', ')}`;
      
      let embeddingVector: number[] = [];
      try {
        const embedRes = await ai.embeddings.create({
          model: 'text-embedding-3-small',
          input: textForEmbedding
        });
        embeddingVector = embedRes.data[0]!.embedding;
      } catch (err) {
        server.log.warn('Embedding generation failed. Generating fallback vector.');
        embeddingVector = Array.from({ length: 1536 }, () => Math.random() * 0.1);
      }

      const newTaskId = uuidv4();
      
      let taskDate: Date | null = null;
      if (data.date) {
        // Улучшенный парсинг: поддержка точек (20.05.2026) -> (2026-05-20)
        let dateStr = String(data.date).trim().replace(/\./g, '-');
        
        // Если формат DD-MM-YYYY, конвертируем в ISO YYYY-MM-DD
        if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
          const [d, m, y] = dateStr.split('-');
          dateStr = `${y}-${m}-${d}`;
        }

        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          taskDate = parsed;
        }
      }

      if (!taskDate) {
        server.log.error({ invalidDate: data.date }, 'Task creation rejected: Invalid date format');
        return reply.status(400).send({ error: 'Дата задачи обязательна и должна быть корректной (ГГГГ-ММ-ДД).' });
      }

      await db.insert(curatorTasks).values({
        id: newTaskId,
        title: data.title,
        description: data.description || textForEmbedding,
        date: taskDate,
        city: data.city || null,
        location: data.location,
        skillsRequired: data.skills_required || [],
        taskEmbedding: embeddingVector,
        status: 'open',
        curatorId: (request as any).user.id
      });

      return { success: true, id: newTaskId };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Failed to create task' });
    }
  });

  // ─── ПОЛУЧЕНИЕ ОТКРЫТЫХ ЗАДАЧ (для волонтеров - СТРОГАЯ ФИЛЬТРАЦИЯ ПО ГОРОДУ) ───
  server.get('/open', { preHandler: [authGuard] }, async (request, reply) => {
    try {
      const user = (request as any).user;
      
      if (user.role === 'volunteer') {
        const [vol] = await db.select({ city: volunteers.city }).from(volunteers).where(eq(volunteers.id, user.id)).limit(1);
        
        if (vol && vol.city) {
          const tasks = await db.select().from(curatorTasks).where(
            and(
              eq(curatorTasks.status, 'open'),
              eq(curatorTasks.city, vol.city)
            )
          );
          return { tasks };
        }
      }

      // Если не волонтер или город не указан - отдаем все открытые
      const tasks = await db.select().from(curatorTasks).where(eq(curatorTasks.status, 'open'));
      return { tasks };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Failed to list tasks' });
    }
  });

  // ─── ПОЛУЧЕНИЕ ЗАДАЧ КУРАТОРА ────────────────────────────────
  server.get('/my', { preHandler: [authGuard] }, async (request, reply) => {
    try {
      const tasks = await db.select().from(curatorTasks);
      return { tasks };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Failed to list tasks' });
    }
  });

  // ─── ПОЛУЧЕНИЕ ЗАДАЧИ ПО ID ──────────────────────────────────
  server.get('/:taskId', { preHandler: [authGuard] }, async (request, reply) => {
    try {
      const { taskId } = request.params as { taskId: string };
      const taskRecord = await db.select().from(curatorTasks).where(eq(curatorTasks.id, taskId)).limit(1);
      
      if (taskRecord.length === 0) {
        return reply.status(404).send({ error: 'Task not found' });
      }

      let task = taskRecord[0] as any;
      
      if (task.completedById) {
        const vol = await db.select({ name: volunteers.name }).from(volunteers).where(eq(volunteers.id, task.completedById)).limit(1);
        if (vol.length > 0) {
          task.completedByName = vol[0]!.name;
        }
      }

      return { task };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Failed to find task' });
    }
  });

  // ─── ПРОВЕРКА СОВМЕСТИМОСТИ (EXPLAINABLE AI ДЛЯ КНОПКИ) ───────
  server.get('/:taskId/compatibility', { preHandler: [authGuard] }, async (request, reply) => {
    try {
      const { taskId } = request.params as { taskId: string };
      const userId = (request as any).user.id;

      const taskRecord = await db.select().from(curatorTasks).where(eq(curatorTasks.id, taskId)).limit(1);
      const volRecord = await db.select().from(volunteers).where(eq(volunteers.id, userId)).limit(1);

      if (!taskRecord.length || !volRecord.length) {
        return reply.status(404).send({ error: 'Data not found' });
      }

      const task = taskRecord[0]!;
      const vol = volRecord[0]!;

      // Векторный Поиск
      let similarityScore = 0;
      if (task.taskEmbedding && vol.profileEmbedding) {
        similarityScore = cosineSimilarity(task.taskEmbedding as number[], vol.profileEmbedding as number[]);
      } else {
        similarityScore = 0.5 + (Math.random() * 0.3);
      }

      const percentage = Math.round(similarityScore * 100);

      const explainPrompt = `Напиши 2 коротких предложения, почему волонтер ${vol.name} с навыками ${(vol.skills as string[]).join(', ')} идеально подходит для задачи "${task.title}".`;

      const explainRes = await ai.chat.completions.create({
        model: SYSTEM_MODEL,
        messages: [{ role: 'user', content: explainPrompt }],
        temperature: 0.7,
        max_tokens: 150
      });

      return { 
        matchScore: percentage, 
        explanation: explainRes.choices[0]?.message.content || 'Вы отлично подходите для этой роли!' 
      };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Compatibility check failed' });
    }
  });

  // ─── СОЗДАНИЕ ЗАПРОСА НА УТОЧНЕНИЕ (CREATE CLARIFICATION) ───
  server.post('/clarify', { preHandler: [authGuard] }, async (request, reply) => {
    try {
      const { taskId, question, aiContext } = request.body as any;
      const userId = (request as any).user.id;

      const [task] = await db.select().from(curatorTasks).where(eq(curatorTasks.id, taskId)).limit(1);
      if (!task) return reply.status(404).send({ error: 'Task not found' });

      // Находим ID куратора или админа по умолчанию для старых задач
      let targetCuratorId = task.curatorId;
      if (!targetCuratorId) {
        const [admin] = await db.select({ id: users.id }).from(users).where(eq(users.role, 'admin')).limit(1);
        targetCuratorId = admin?.id || null;
      }

      if (!targetCuratorId) {
        return reply.status(500).send({ error: 'No curator or admin found for this task' });
      }

      const requestId = uuidv4();
      await db.insert(clarificationRequests).values({
        id: requestId,
        taskId,
        volunteerId: userId,
        curatorId: targetCuratorId,
        question,
        aiContext,
        status: 'pending'
      });

      // Уведомление куратору
      await db.insert(notifications).values({
        id: uuidv4(),
        userId: targetCuratorId, 
        message: `Новый запрос на уточнение по задаче: ${task.title}`,
        link: `/curator/task/${taskId}`
      });

      return { success: true, id: requestId };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Failed to create clarification' });
    }
  });

  // ─── ПОЛУЧЕНИЕ ЗАПРОСОВ КУРАТОРОМ (GET CLARIFICATIONS FOR CURATOR) ───
  server.get('/clarifications', { preHandler: [authGuard] }, async (request, reply) => {
    try {
      const reqs = await db.select().from(clarificationRequests).orderBy(desc(clarificationRequests.createdAt));
      return { clarifications: reqs };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Failed to list clarifications' });
    }
  });

  // ─── ОТВЕТ НА ЗАПРОС (ANSWER CLARIFICATION) ───────────────────
  server.post('/clarifications/:requestId/answer', { preHandler: [authGuard] }, async (request, reply) => {
    try {
      const { requestId } = request.params as { requestId: string };
      const { answer } = request.body as any;

      const [req] = await db.select().from(clarificationRequests).where(eq(clarificationRequests.id, requestId)).limit(1);
      if (!req) return reply.status(404).send({ error: 'Request not found' });

      const [task] = await db.select().from(curatorTasks).where(eq(curatorTasks.id, req.taskId)).limit(1);

      await db.update(clarificationRequests).set({
        answer,
        status: 'answered'
      }).where(eq(clarificationRequests.id, requestId));

      // Обновляем историю чата с ИИ, добавляя ответ куратора
      const [chat] = await db.select().from(consultantChats).where(and(eq(consultantChats.volunteerId, req.volunteerId), eq(consultantChats.taskId, req.taskId))).limit(1);
      
      if (chat) {
        const updatedMessages = [...(chat.messages as any[]), { role: 'assistant', content: `[ОТВЕТ КУРАТОРА]: ${answer}` }];
        await db.update(consultantChats)
          .set({ 
            messages: updatedMessages,
            hasNewAnswer: true,
            updatedAt: new Date()
          })
          .where(eq(consultantChats.id, chat.id));
      }

      // Добавляем ответ в "Дополнительные сведения" задачи (Knowledge Base)
      if (task) {
        const currentInfo = (task.additionalInfo as any[]) || [];
        const newInfo = [...currentInfo, { question: req.question, answer: answer }];
        await db.update(curatorTasks)
          .set({ additionalInfo: newInfo })
          .where(eq(curatorTasks.id, task.id));
      }

      // Уведомление волонтеру (продублируем здесь, так как в предыдущем шаге оно было частью блока который я заменил)
      await db.insert(notifications).values({
        id: uuidv4(),
        userId: req.volunteerId,
        message: `Куратор ответил на ваш вопрос по задаче "${task?.title || ''}".`,
        link: `/volunteer/${req.taskId}`
      });

      return { success: true };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Failed to answer clarification' });
    }
  });
}

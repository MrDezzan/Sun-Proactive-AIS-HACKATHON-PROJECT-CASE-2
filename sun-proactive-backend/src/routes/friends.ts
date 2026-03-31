import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { volunteers, friendships, users, privateMessages, notifications } from '../db/schema.js';
import { eq, and, ne, or, inArray, sql, asc } from 'drizzle-orm';
import { authGuard } from '../middleware/auth.js';
import crypto from 'crypto';

export default async function friendsRoutes(server: FastifyInstance) {

  // 1. РЕКОМЕНДАЦИИ (Люди из твоего города)
  server.get('/recommendations', { preHandler: [authGuard] }, async (request, reply) => {
    try {
      const userId = (request as any).user.id;
      
      // Получаем город пользователя
      const [currentUser] = await db.select({ city: volunteers.city }).from(volunteers).where(eq(volunteers.id, userId)).limit(1);
      if (!currentUser || !currentUser.city) return { recommendations: [] };

      // Ищем людей из того же города, кроме самого себя
      const candidates = await db
        .select({
          id: volunteers.id,
          name: volunteers.name,
          skills: volunteers.skills,
          city: volunteers.city
        })
        .from(volunteers)
        .where(
          and(
            eq(volunteers.city, currentUser.city),
            ne(volunteers.id, userId)
          )
        );

      // Фильтруем тех, с кем уже есть связь (pending или accepted)
      const existingRelations = await db
        .select()
        .from(friendships)
        .where(
          or(
            eq(friendships.requesterId, userId),
            eq(friendships.receiverId, userId)
          )
        );

      const relatedIds = new Set(existingRelations.flatMap(r => [r.requesterId, r.receiverId]));
      
      const recommendations = candidates.filter(c => !relatedIds.has(c.id));

      return { recommendations };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Failed to find recommendations' });
    }
  });

  // 2. ОТПРАВИТЬ ЗАЯВКУ
  server.post('/request', { preHandler: [authGuard] }, async (request, reply) => {
    try {
      const userId = (request as any).user.id;
      const { receiverId } = request.body as { receiverId: string };

      if (userId === receiverId) return reply.status(400).send({ error: 'Cannot add yourself' });

      // Проверка существующей связи
      const existing = await db
        .select()
        .from(friendships)
        .where(
          or(
            and(eq(friendships.requesterId, userId), eq(friendships.receiverId, receiverId)),
            and(eq(friendships.requesterId, receiverId), eq(friendships.receiverId, userId))
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return reply.status(400).send({ error: 'Relationship already exists' });
      }

      await db.insert(friendships).values({
        id: crypto.randomUUID(),
        requesterId: userId,
        receiverId,
        status: 'pending'
      });

      // Уведомление о заявке в друзья
      const [sender] = await db.select({ name: volunteers.name }).from(volunteers).where(eq(volunteers.id, userId)).limit(1);
      await db.insert(notifications).values({
        id: crypto.randomUUID(),
        userId: receiverId,
        message: `Пользователь ${sender?.name || 'Кто-то'} хочет добавить вас в друзья`,
        link: '/profile' // Или страница со списком заявок
      });

      return { success: true };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Failed to send request' });
    }
  });

  // 3. СПИСОК ВХОДЯЩИХ ЗАЯВОК
  server.get('/requests', { preHandler: [authGuard] }, async (request, reply) => {
    try {
      const userId = (request as any).user.id;

      const incoming = await db
        .select({
          id: friendships.id,
          senderId: volunteers.id,
          senderName: volunteers.name,
          createdAt: friendships.createdAt
        })
        .from(friendships)
        .innerJoin(volunteers, eq(friendships.requesterId, volunteers.id))
        .where(
          and(
            eq(friendships.receiverId, userId),
            eq(friendships.status, 'pending')
          )
        );

      return { requests: incoming };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch requests' });
    }
  });

  // 3.5 СПИСОК ИСХОДЯЩИХ ЗАЯВОК (Outgoing Requests)
  server.get('/requests/outgoing', { preHandler: [authGuard] }, async (request, reply) => {
    try {
      const userId = (request as any).user.id;
      const outgoing = await db
        .select({
          id: friendships.id,
          receiverId: volunteers.id,
          receiverName: volunteers.name,
          createdAt: friendships.createdAt,
          status: friendships.status
        })
        .from(friendships)
        .innerJoin(volunteers, eq(friendships.receiverId, volunteers.id))
        .where(
          and(
            eq(friendships.requesterId, userId),
            eq(friendships.status, 'pending')
          )
        );
      return { requests: outgoing };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch outgoing requests' });
    }
  });

  // 4. ПРИНЯТЬ ЗАЯВКУ
  server.post('/accept', { preHandler: [authGuard] }, async (request, reply) => {
    try {
      const userId = (request as any).user.id;
      const { requestId } = request.body as { requestId: string };

      await db
        .update(friendships)
        .set({ status: 'accepted' })
        .where(
          and(
            eq(friendships.id, requestId),
            eq(friendships.receiverId, userId)
          )
        );

      // Уведомление о принятии заявки
      const [rel] = await db.select().from(friendships).where(eq(friendships.id, requestId)).limit(1);
      if (rel) {
        const [acceptor] = await db.select({ name: volunteers.name }).from(volunteers).where(eq(volunteers.id, userId)).limit(1);
        await db.insert(notifications).values({
          id: crypto.randomUUID(),
          userId: rel.requesterId,
          message: `${acceptor?.name || 'Кто-то'} принял вашу заявку в друзья!`,
          link: `/profile/${userId}`
        });
      }

      return { success: true };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Failed to accept friend' });
    }
  });

  // 5. МОИ ДРУЗЬЯ
  server.get('/list', { preHandler: [authGuard] }, async (request, reply) => {
    try {
      const userId = (request as any).user.id;

      const friendsData = await db
        .select()
        .from(friendships)
        .where(
          and(
            or(eq(friendships.requesterId, userId), eq(friendships.receiverId, userId)),
            eq(friendships.status, 'accepted')
          )
        );

      const friendIds = friendsData.map(f => f.requesterId === userId ? f.receiverId : f.requesterId);

      if (friendIds.length === 0) return { friends: [] };

      // Получаем инфу о друзьях
      const friends = await db
        .select({
          id: volunteers.id,
          name: volunteers.name,
          city: volunteers.city,
          skills: volunteers.skills
        })
        .from(volunteers)
        .where(inArray(volunteers.id, friendIds));

      return { friends };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch friends' });
    }
  });

  // 6. ПОЛУЧЕНИЕ ПУБЛИЧНОГО ПРОФИЛЯ
  server.get('/profile/:id', { preHandler: [authGuard] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const userId = (request as any).user.id;

      const [vol] = await db
        .select({
          id: volunteers.id,
          name: volunteers.name,
          city: volunteers.city,
          skills: volunteers.skills,
          interests: volunteers.interests,
          goals: volunteers.goals,
          createdAt: volunteers.createdAt
        })
        .from(volunteers)
        .where(eq(volunteers.id, id))
        .limit(1);

      if (!vol) return reply.status(404).send({ error: 'Volunteer not found' });

      // Проверяем статус дружбы
      const [relation] = await db
        .select()
        .from(friendships)
        .where(
          or(
            and(eq(friendships.requesterId, userId), eq(friendships.receiverId, id)),
            and(eq(friendships.requesterId, id), eq(friendships.receiverId, userId))
          )
        )
        .limit(1);

      return { 
        profile: vol, 
        friendshipStatus: relation ? relation.status : null,
        isRequester: relation ? relation.requesterId === userId : false,
        requestId: relation ? relation.id : null
      };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch profile' });
    }
  });

  // 7. ИСТОРИЯ ЧАТА С ДРУГОМ
  server.get('/chat/:friendId', { preHandler: [authGuard] }, async (request, reply) => {
    try {
      const userId = (request as any).user.id;
      const { friendId } = request.params as { friendId: string };

      // Проверяем статус дружбы
      const [relation] = await db
        .select()
        .from(friendships)
        .where(
          and(
            or(
              and(eq(friendships.requesterId, userId), eq(friendships.receiverId, friendId)),
              and(eq(friendships.requesterId, friendId), eq(friendships.receiverId, userId))
            ),
            eq(friendships.status, 'accepted')
          )
        )
        .limit(1);

      if (!relation) return reply.status(403).send({ error: 'You are not friends' });

      const messages = await db
        .select()
        .from(privateMessages)
        .where(
          or(
            and(eq(privateMessages.senderId, userId), eq(privateMessages.receiverId, friendId)),
            and(eq(privateMessages.senderId, friendId), eq(privateMessages.receiverId, userId))
          )
        )
        .orderBy(asc(privateMessages.createdAt));

      return { messages };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Failed to fetch chat history' });
    }
  });

  // 8. ОТПРАВКА СООБЩЕНИЯ ДРУГУ
  server.post('/chat/:friendId', { preHandler: [authGuard] }, async (request, reply) => {
    try {
      const userId = (request as any).user.id;
      const { friendId } = request.params as { friendId: string };
      const { message } = request.body as { message: string };

      if (!message || !message.trim()) return reply.status(400).send({ error: 'Message cannot be empty' });

      // Проверяем статус дружбы
      const [relation] = await db
        .select()
        .from(friendships)
        .where(
          and(
            or(
              and(eq(friendships.requesterId, userId), eq(friendships.receiverId, friendId)),
              and(eq(friendships.requesterId, friendId), eq(friendships.receiverId, userId))
            ),
            eq(friendships.status, 'accepted')
          )
        )
        .limit(1);

      if (!relation) return reply.status(403).send({ error: 'You are not friends' });

      await db.insert(privateMessages).values({
        id: crypto.randomUUID(),
        senderId: userId,
        receiverId: friendId,
        message: message.trim(),
        isRead: false
      });

      // Уведомление о сообщении
      const [senderMsg] = await db.select({ name: volunteers.name }).from(volunteers).where(eq(volunteers.id, userId)).limit(1);
      await db.insert(notifications).values({
        id: crypto.randomUUID(),
        userId: friendId,
        message: `Новое сообщение от ${senderMsg?.name || 'друга'}`,
        link: `/profile/chat/${userId}`
      });

      return { success: true };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Failed to send message' });
    }
  });
}

import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { users, volunteers } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { signToken, authGuard } from '../middleware/auth.js';
import { ai } from '../services/ai.js';

const SALT_ROUNDS = 12;

export default async function authRoutes(server: FastifyInstance) {

  // ─── АВТОРИЗАЦИЯ (LOGIN) ────────────────────────────────────
  server.post('/login', async (request, reply) => {
    try {
      const { email, password } = request.body as { email: string; password: string };

      if (!email || !password) {
        return reply.status(400).send({ error: 'Email и пароль обязательны' });
      }

      const foundUsers = await db.select().from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (foundUsers.length === 0) {
        return reply.status(401).send({ error: 'Неверный логин или пароль' });
      }

      const user = foundUsers[0]!;

      // Сравнение хеша bcrypt
      const passwordValid = await bcrypt.compare(password, user.password);
      if (!passwordValid) {
        return reply.status(401).send({ error: 'Неверный логин или пароль' });
      }

      if (!user.isApproved && user.role !== 'admin') {
        return reply.status(403).send({ error: 'Ваш аккаунт еще не одобрен администратором.' });
      }

      // Генерация JWT
      const token = signToken({ id: user.id, role: user.role, isApproved: user.isApproved });

      let redirect = '/';
      if (user.mustChangePassword) {
        redirect = '/auth/change-password';
      } else {
        if (user.role === 'admin') redirect = '/admin';
        if (user.role === 'curator') redirect = '/curator';
        if (user.role === 'volunteer') redirect = '/volunteer';
      }

      return { 
        success: true, 
        token, 
        redirect, 
        user: { 
          id: user.id, 
          role: user.role, 
          isApproved: user.isApproved,
          mustChangePassword: user.mustChangePassword 
        } 
      };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // ─── РЕГИСТРАЦИЯ (REGISTER) ─────────────────────────────────
  server.post('/register', async (request, reply) => {
    try {
      const data = request.body as any;
      const { email, password, role, name, skills, birthDate, city } = data;

      if (!email || !password || !role) {
        return reply.status(400).send({ error: 'Email, пароль и роль обязательны' });
      }

      // Проверка существования пользователя
      const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existing.length > 0) {
        return reply.status(400).send({ error: 'Пользователь уже существует' });
      }

      // Валидация в зависимости от роли
      if (role === 'volunteer') {
        if (!birthDate) return reply.status(400).send({ error: 'Укажите дату рождения' });
        
        const birthYear = new Date(birthDate).getFullYear();
        const currentYear = new Date().getFullYear();
        const age = currentYear - birthYear;
        
        if (age < 12) {
          return reply.status(400).send({ error: 'Волонтерство доступно только с 12 лет' });
        }
      }

      // Хеширование пароля с bcrypt
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      const userId = uuidv4();
      const isApproved = (role === 'admin' || role === 'volunteer') ? true : false;

      await db.insert(users).values({
        id: userId,
        email,
        password: hashedPassword,
        role,
        isApproved
      });

      if (role === 'volunteer') {
        let embeddingVector: number[] = Array.from({ length: 1536 }, () => Math.random() * 0.1);
        try {
          const embedRes = await ai.embeddings.create({
            model: 'text-embedding-3-small',
            input: `Навыки волонтера: ${skills?.join(', ')}. Имя: ${name}. Город: ${city || 'Не указан'}`
          });
          embeddingVector = embedRes.data[0]!.embedding;
        } catch (e) {
          server.log.warn('Embedding fallback used for volunteer registration');
        }

        await db.insert(volunteers).values({
          id: userId,
          name: name || 'Без имени',
          city: city || null,
          birthDate: birthDate,
          skills: skills || [],
          profileEmbedding: embeddingVector
        });
      }

      if (role === 'curator') {
        return { success: true, message: 'Регистрация успешна. Ожидайте одобрения администратором.' };
      }
      
      return { success: true, message: 'Регистрация успешна. Вы можете войти в систему!' };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // ─── ВЫХОД (LOGOUT) - stateless JWT ─────────────────────────
  server.post('/logout', async () => {
    return { success: true, message: 'Logged out. Discard token on client side.' };
  });

  // ─── СМЕНА ПАРОЛЯ (CHANGE PASSWORD) ─────────────────────────
  server.post('/change-password', { preHandler: [authGuard] }, async (request, reply) => {
    try {
      const { newPassword } = request.body as { newPassword: string };
      const userId = (request as any).user.id;

      if (!newPassword || newPassword.length < 4) {
        return reply.status(400).send({ error: 'Пароль слишком короткий' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

      await db.update(users)
        .set({ 
          password: hashedPassword, 
          mustChangePassword: false 
        })
        .where(eq(users.id, userId));

      return { success: true, message: 'Пароль успешно изменен' };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Failed to change password' });
    }
  });
}

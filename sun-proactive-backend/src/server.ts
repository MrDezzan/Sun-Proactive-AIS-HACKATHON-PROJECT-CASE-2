import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import * as dotenv from 'dotenv';
import apiRoutes from './routes/index.js';

dotenv.config();

const server = Fastify({
  logger: true,
  bodyLimit: 10 * 1024 * 1024, // Лимит 10MB для фото верификации
});

// ─── Безопасность: HTTP Заголовки (Helmet) ─────────────────
server.register(helmet, {
  contentSecurityPolicy: false, // Отключаем CSP для чистого API
});

// ─── Безопасность: Ограничение запросов (Rate Limiting) ───────
server.register(rateLimit, {
  max: 100, // 100 запросов в минуту на один IP
  timeWindow: '1 minute',
});

// ─── CORS ──────────────────────────────────────────────────────
server.register(cors, {
  origin: process.env.FRONTEND_URL || '*', // В проде нужно ограничить
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Cron-Secret'],
  credentials: true,
});

// ─── Маршрут проверки здоровья (Health Check) ──────────────────
server.get('/health', async () => {
  return { status: 'ok', time: new Date().toISOString() };
});

// ─── API Маршруты ──────────────────────────────────────────────
server.register(apiRoutes, { prefix: '/api' });

// ─── Запуск сервера ────────────────────────────────────────────
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '8080');
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Sun Proactive Backend listening on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();

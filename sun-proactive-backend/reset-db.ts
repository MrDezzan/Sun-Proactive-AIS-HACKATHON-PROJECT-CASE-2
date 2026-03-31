import { db } from './src/db/index.js';
import { users, volunteers, curatorTasks, taskResponses, notifications, teams, teamMembers, teamMessages, friendships } from './src/db/schema.js';
import { sql } from 'drizzle-orm';

async function resetDb() {
  console.log('🔄 Начинаем очистку базы данных...');
  try {
    // Truncate tables with cascade (or manually in order)
    await db.execute(sql`TRUNCATE TABLE friendships, team_messages, team_members, teams, notifications, task_responses, curator_tasks, volunteers, users CASCADE`);
    console.log('✅ Все таблицы успешно очищены!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Ошибка при очистке БД:', err);
    process.exit(1);
  }
}

resetDb();

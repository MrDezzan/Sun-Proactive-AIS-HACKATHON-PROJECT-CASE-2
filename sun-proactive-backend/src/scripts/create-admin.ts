import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const SALT_ROUNDS = 12;

async function createAdmin() {
  const email = 'admin@sun.pro';
  const password = 'admin'; // Рекомендуется сменить после входа

  console.log(`Creating admin user: ${email}...`);

  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
    await db.insert(users).values({
      id: uuidv4(),
      email,
      password: hashedPassword,
      role: 'admin',
      isApproved: true,
      mustChangePassword: true
    }).onConflictDoNothing();

    console.log('✅ Admin user created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to create admin:', error);
    process.exit(1);
  }
}

createAdmin();

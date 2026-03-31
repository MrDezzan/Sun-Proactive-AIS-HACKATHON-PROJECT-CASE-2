import { pgTable, text, integer, boolean, timestamp, jsonb, primaryKey } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: text('role').notNull(), // 'admin', 'curator', 'volunteer'
  isApproved: boolean('is_approved').default(false).notNull(),
  mustChangePassword: boolean('must_change_password').default(false).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
});

export const volunteers = pgTable('volunteers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  city: text('city'),
  birthDate: text('birth_date'),
  skills: jsonb('skills').$type<string[]>().notNull(),
  interests: jsonb('interests').$type<string[]>().default([]),
  goals: text('goals'),
  profileEmbedding: jsonb('profile_embedding').$type<number[]>(),
  createdAt: timestamp('created_at', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
});

export const curatorTasks = pgTable('curator_tasks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  date: timestamp('date', { mode: 'date' }).notNull(),
  city: text('city'),
  location: text('location'),
  skillsRequired: jsonb('skills_required').$type<string[]>().notNull(),
  taskEmbedding: jsonb('task_embedding').$type<number[]>(),
  status: text('status').default('open').notNull(),
  curatorId: text('curator_id').references(() => users.id),
  completedById: text('completed_by_id').references(() => volunteers.id),
  completionPhoto: text('completion_photo'),
  completionText: text('completion_text'),
  aiScore: integer('ai_score'),
  additionalInfo: jsonb('additional_info').$type<{question: string, answer: string}[]>().default([]),
  createdAt: timestamp('created_at', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
});

export const taskResponses = pgTable('task_responses', {
  id: text('id').primaryKey(),
  taskId: text('task_id').references(() => curatorTasks.id).notNull(),
  volunteerId: text('volunteer_id').references(() => volunteers.id).notNull(),
  matchScore: text('match_score'),
  matchExplanation: text('match_explanation'),
  status: text('status').default('pending').notNull(),
  verificationPhoto: text('verification_photo'),
  verificationComment: text('verification_comment'),
  createdAt: timestamp('created_at', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
});

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  link: text('link'),
  createdAt: timestamp('created_at', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
});

export const teams = pgTable('teams', {
  id: text('id').primaryKey(),
  taskId: text('task_id').references(() => curatorTasks.id).notNull(),
  creatorId: text('creator_id').references(() => volunteers.id).notNull(),
  maxMembers: integer('max_members').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
});

export const teamMembers = pgTable('team_members', {
  teamId: text('team_id').references(() => teams.id).notNull(),
  volunteerId: text('volunteer_id').references(() => volunteers.id).notNull(),
  joinedAt: timestamp('joined_at', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
}, (tc) => ({
  pk: primaryKey({ columns: [tc.teamId, tc.volunteerId] }),
}));

export const teamMessages = pgTable('team_messages', {
  id: text('id').primaryKey(),
  teamId: text('team_id').references(() => teams.id).notNull(),
  senderId: text('sender_id').references(() => volunteers.id).notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
});

export const friendships = pgTable('friendships', {
  id: text('id').primaryKey(),
  requesterId: text('requester_id').references(() => volunteers.id).notNull(),
  receiverId: text('receiver_id').references(() => volunteers.id).notNull(),
  status: text('status').default('pending').notNull(), // 'pending', 'accepted'
  createdAt: timestamp('created_at', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
});

export const privateMessages = pgTable('private_messages', {
  id: text('id').primaryKey(),
  senderId: text('sender_id').references(() => volunteers.id).notNull(),
  receiverId: text('receiver_id').references(() => volunteers.id).notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
});

export const clarificationRequests = pgTable('clarification_requests', {
  id: text('id').primaryKey(),
  taskId: text('task_id').references(() => curatorTasks.id).notNull(),
  volunteerId: text('volunteer_id').references(() => volunteers.id).notNull(),
  curatorId: text('curator_id').references(() => users.id).notNull(),
  question: text('question').notNull(),
  aiContext: text('ai_context'),
  status: text('status').default('pending').notNull(), // 'pending', 'answered'
  answer: text('answer'),
  createdAt: timestamp('created_at', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
});

export const consultantChats = pgTable('consultant_chats', {
  id: text('id').primaryKey(),
  volunteerId: text('volunteer_id').references(() => volunteers.id).notNull(),
  taskId: text('task_id').references(() => curatorTasks.id).notNull(),
  messages: jsonb('messages').$type<any[]>().notNull(), // Array of Message objects
  hasNewAnswer: boolean('has_new_answer').default(false).notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
});

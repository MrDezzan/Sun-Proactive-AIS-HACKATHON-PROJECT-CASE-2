import { pgTable, text, integer, boolean, timestamp, jsonb, primaryKey } from 'drizzle-orm/pg-core';
export const users = pgTable('users', {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    password: text('password').notNull(),
    role: text('role').notNull(), // 'admin', 'curator', 'volunteer'
    isApproved: boolean('is_approved').default(false).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
});
export const volunteers = pgTable('volunteers', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    birthDate: text('birth_date'),
    skills: jsonb('skills').$type().notNull(),
    interests: jsonb('interests').$type().default([]),
    goals: text('goals'),
    profileEmbedding: jsonb('profile_embedding').$type(),
    createdAt: timestamp('created_at', { mode: 'date' }).$defaultFn(() => new Date()).notNull(),
});
export const curatorTasks = pgTable('curator_tasks', {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    date: timestamp('date', { mode: 'date' }),
    location: text('location'),
    skillsRequired: jsonb('skills_required').$type().notNull(),
    taskEmbedding: jsonb('task_embedding').$type(),
    status: text('status').default('open').notNull(),
    completedById: text('completed_by_id').references(() => volunteers.id),
    completionPhoto: text('completion_photo'),
    completionText: text('completion_text'),
    aiScore: integer('ai_score'),
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
//# sourceMappingURL=schema.js.map
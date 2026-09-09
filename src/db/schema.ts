import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const conversations = pgTable('conversations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  sender: text('sender').notNull(), // 'user' | 'neurocore'
  text: text('text').notNull(),
  spokenReply: text('spoken_reply'),
  desktopAction: text('desktop_action'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const artifacts = pgTable('artifacts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  artifactId: text('artifact_id').notNull(),
  title: text('title').notNull(),
  type: text('type').notNull(),
  filename: text('filename'),
  language: text('language'),
  summary: text('summary'),
  content: text('content'),
  status: text('status'),
  tags: text('tags'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  conversations: many(conversations),
  artifacts: many(artifacts),
}));

export const conversationsRelations = relations(conversations, ({ one }) => ({
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
}));

export const artifactsRelations = relations(artifacts, ({ one }) => ({
  user: one(users, {
    fields: [artifacts.userId],
    references: [users.id],
  }),
}));

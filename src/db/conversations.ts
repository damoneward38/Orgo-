import { db } from './index.ts';
import { conversations } from './schema.ts';
import { eq, desc } from 'drizzle-orm';

export interface SaveConversationParams {
  userId: number;
  sender: 'user' | 'neurocore';
  text: string;
  spokenReply?: string;
  desktopAction?: string;
}

export async function saveConversationMessage(params: SaveConversationParams) {
  try {
    const result = await db
      .insert(conversations)
      .values({
        userId: params.userId,
        sender: params.sender,
        text: params.text,
        spokenReply: params.spokenReply || null,
        desktopAction: params.desktopAction || null,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database query failed in saveConversationMessage:', error);
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    });
  }
}

export async function getUserConversations(userId: number, limit = 50) {
  try {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.createdAt))
      .limit(limit);
  } catch (error) {
    console.error('Database query failed in getUserConversations:', error);
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    });
  }
}

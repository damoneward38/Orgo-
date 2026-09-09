import { db } from './index.ts';
import { artifacts } from './schema.ts';
import { eq, desc } from 'drizzle-orm';

export interface SaveArtifactParams {
  userId: number;
  artifactId: string;
  title: string;
  type: string;
  filename?: string;
  language?: string;
  summary?: string;
  content?: string;
  status?: string;
  tags?: string;
}

export async function saveUserArtifact(params: SaveArtifactParams) {
  try {
    const result = await db
      .insert(artifacts)
      .values({
        userId: params.userId,
        artifactId: params.artifactId,
        title: params.title,
        type: params.type,
        filename: params.filename || null,
        language: params.language || null,
        summary: params.summary || null,
        content: params.content || null,
        status: params.status || 'completed',
        tags: params.tags || null,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database query failed in saveUserArtifact:', error);
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    });
  }
}

export async function getUserArtifacts(userId: number) {
  try {
    return await db
      .select()
      .from(artifacts)
      .where(eq(artifacts.userId, userId))
      .orderBy(desc(artifacts.createdAt));
  } catch (error) {
    console.error('Database query failed in getUserArtifacts:', error);
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    });
  }
}

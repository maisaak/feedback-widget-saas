import "server-only";

import {
  ensureDemoWorkspace,
  feedbacks,
  getDb,
  projects,
  users,
  type feedbackStatus,
} from "@feedback-widget/database";
import { and, count, desc, eq, gte, ilike, sql } from "drizzle-orm";

export { ensureDemoWorkspace };

export type FeedbackStatus = (typeof feedbackStatus.enumValues)[number];
export type Feedback = typeof feedbacks.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type User = typeof users.$inferSelect;

export async function listProjects(userId: string): Promise<Project[]> {
  const db = await getDb();
  return db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.createdAt));
}

export async function getProject(projectId: string): Promise<Project | null> {
  const db = await getDb();
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  return project ?? null;
}

export async function findProjectByApiKey(apiKey: string): Promise<Project | null> {
  const db = await getDb();
  const [project] = await db.select().from(projects).where(eq(projects.apiKey, apiKey)).limit(1);
  return project ?? null;
}

export async function createProject(userId: string, name: string): Promise<Project> {
  const db = await getDb();
  const [project] = await db
    .insert(projects)
    .values({ name: name.trim() || "Untitled project", userId })
    .returning();
  return project;
}

export async function listFeedbacks(options: {
  projectId: string;
  status?: FeedbackStatus;
  query?: string;
  limit?: number;
}): Promise<Feedback[]> {
  const db = await getDb();
  const filters = [eq(feedbacks.projectId, options.projectId)];
  if (options.status) filters.push(eq(feedbacks.status, options.status));
  if (options.query?.trim()) {
    filters.push(ilike(feedbacks.message, `%${options.query.trim()}%`));
  }

  return db
    .select()
    .from(feedbacks)
    .where(and(...filters))
    .orderBy(desc(feedbacks.createdAt))
    .limit(options.limit ?? 100);
}

export async function getFeedback(projectId: string, feedbackId: string): Promise<Feedback | null> {
  const db = await getDb();
  const [feedback] = await db
    .select()
    .from(feedbacks)
    .where(and(eq(feedbacks.id, feedbackId), eq(feedbacks.projectId, projectId)))
    .limit(1);
  return feedback ?? null;
}

export async function insertFeedback(input: {
  projectId: string;
  message: string;
  email?: string | null;
  rating?: number | null;
  metadata?: Record<string, unknown> | null;
}): Promise<Feedback> {
  const db = await getDb();
  const [feedback] = await db
    .insert(feedbacks)
    .values({
      projectId: input.projectId,
      message: input.message,
      email: input.email ?? null,
      rating: input.rating ?? null,
      metadata: input.metadata ?? null,
    })
    .returning();
  return feedback;
}

export async function updateFeedbackStatus(
  projectId: string,
  feedbackId: string,
  status: FeedbackStatus,
): Promise<Feedback | null> {
  const db = await getDb();
  const [feedback] = await db
    .update(feedbacks)
    .set({ status })
    .where(and(eq(feedbacks.id, feedbackId), eq(feedbacks.projectId, projectId)))
    .returning();
  return feedback ?? null;
}

export async function deleteFeedback(projectId: string, feedbackId: string): Promise<boolean> {
  const db = await getDb();
  const deleted = await db
    .delete(feedbacks)
    .where(and(eq(feedbacks.id, feedbackId), eq(feedbacks.projectId, projectId)))
    .returning({ id: feedbacks.id });
  return deleted.length > 0;
}

export type FeedbackStats = {
  total: number;
  byStatus: Record<FeedbackStatus, number>;
  averageRating: number | null;
  daily: Array<{ date: string; count: number }>;
};

export async function getFeedbackStats(projectId: string, days = 14): Promise<FeedbackStats> {
  const db = await getDb();
  const today = new Date();
  const start = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - (days - 1)),
  );

  const dayExpression = sql<string>`to_char(date_trunc('day', ${feedbacks.createdAt} at time zone 'UTC'), 'YYYY-MM-DD')`;

  const [statusRows, ratingRows, dailyRows] = await Promise.all([
    db
      .select({ status: feedbacks.status, value: count() })
      .from(feedbacks)
      .where(eq(feedbacks.projectId, projectId))
      .groupBy(feedbacks.status),
    db
      .select({ average: sql<string | null>`avg(${feedbacks.rating})` })
      .from(feedbacks)
      .where(eq(feedbacks.projectId, projectId)),
    db
      .select({ date: dayExpression, value: count() })
      .from(feedbacks)
      .where(and(eq(feedbacks.projectId, projectId), gte(feedbacks.createdAt, start)))
      .groupBy(dayExpression),
  ]);

  const byStatus: Record<FeedbackStatus, number> = { new: 0, in_progress: 0, resolved: 0 };
  let total = 0;
  for (const row of statusRows) {
    byStatus[row.status] = Number(row.value);
    total += Number(row.value);
  }

  const averageRating = ratingRows[0]?.average ? Math.round(Number(ratingRows[0].average) * 10) / 10 : null;

  const countsByDate = new Map(dailyRows.map((row) => [row.date, Number(row.value)]));
  const daily: Array<{ date: string; count: number }> = [];
  for (let offset = 0; offset < days; offset += 1) {
    const date = new Date(start.getTime() + offset * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    daily.push({ date, count: countsByDate.get(date) ?? 0 });
  }

  return { total, byStatus, averageRating, daily };
}

"use server";

import { revalidatePath } from "next/cache";
import {
  deleteFeedback,
  ensureDemoWorkspace,
  updateFeedbackStatus,
  type FeedbackStatus,
} from "./data";

const STATUSES: FeedbackStatus[] = ["new", "in_progress", "resolved"];

export async function updateStatusAction(feedbackId: string, status: FeedbackStatus): Promise<void> {
  if (!STATUSES.includes(status)) {
    throw new Error("Unknown feedback status");
  }
  const { project } = await ensureDemoWorkspace();
  await updateFeedbackStatus(project.id, feedbackId, status);
  revalidatePath("/dashboard");
}

export async function deleteFeedbackAction(feedbackId: string): Promise<void> {
  const { project } = await ensureDemoWorkspace();
  await deleteFeedback(project.id, feedbackId);
  revalidatePath("/dashboard");
}

import "server-only";

import type { Feedback } from "./data";

export async function notifyFeedback(feedback: Feedback): Promise<void> {
  try {
    const url = process.env.FEEDBACK_WEBHOOK_URL;
    if (!url) return;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(feedback),
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) {
      throw new Error(`Feedback webhook returned HTTP ${response.status}`);
    }
  } catch (error: unknown) {
    console.error("Feedback webhook failed", error);
  }
}

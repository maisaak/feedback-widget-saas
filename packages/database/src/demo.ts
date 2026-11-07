import { eq } from "drizzle-orm";
import { getDb } from "./connection";
import { feedbacks, projects, users } from "./schema";

export const DEMO_USER_EMAIL = "demo@feedback-widget.local";
const DEMO_PROJECT_NAME = "Acme Storefront";

type SampleFeedback = {
  message: string;
  email: string | null;
  rating: number | null;
  status: "new" | "in_progress" | "resolved";
  daysAgo: number;
};

const SAMPLE_FEEDBACKS: SampleFeedback[] = [
  {
    message: "Checkout button does nothing on Safari 17 when the cart has a discount code.",
    email: "mira@example.com",
    rating: 2,
    status: "new",
    daysAgo: 0,
  },
  {
    message: "Loving the new product filters — found what I needed in seconds.",
    email: "dev@example.com",
    rating: 5,
    status: "resolved",
    daysAgo: 1,
  },
  {
    message: "Could you add dark mode? My eyes hurt browsing at night.",
    email: null,
    rating: 4,
    status: "in_progress",
    daysAgo: 2,
  },
  {
    message: "The order confirmation email landed in spam. Please check your DNS records.",
    email: "ops@example.com",
    rating: 3,
    status: "new",
    daysAgo: 3,
  },
  {
    message: "Search results ignore typos — 'snekers' returned nothing.",
    email: "sam@example.com",
    rating: 3,
    status: "in_progress",
    daysAgo: 4,
  },
  {
    message: "Shipping estimate said 2 days but it took 6. Otherwise great packaging.",
    email: null,
    rating: 4,
    status: "resolved",
    daysAgo: 6,
  },
  {
    message: "Please support Apple Pay at checkout, typing card details is painful.",
    email: "alex@example.com",
    rating: 5,
    status: "new",
    daysAgo: 8,
  },
  {
    message: "Page loads slowly on mobile data, images are not lazy loaded.",
    email: null,
    rating: 2,
    status: "in_progress",
    daysAgo: 11,
  },
  {
    message: "Best shopping experience I have had this year. Keep it up!",
    email: "jo@example.com",
    rating: 5,
    status: "resolved",
    daysAgo: 14,
  },
];

/**
 * Creates the demo user, project and sample feedback on first run so the
 * dashboard is useful immediately after `pnpm dev`.
 */
export async function ensureDemoWorkspace(): Promise<{
  user: typeof users.$inferSelect;
  project: typeof projects.$inferSelect;
}> {
  const db = await getDb();

  await db.insert(users).values({ email: DEMO_USER_EMAIL, name: "Demo Owner" }).onConflictDoNothing();
  const [user] = await db.select().from(users).where(eq(users.email, DEMO_USER_EMAIL)).limit(1);
  if (!user) throw new Error("Failed to create the demo user");

  const [existingProject] = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, user.id))
    .limit(1);

  if (existingProject) {
    return { user, project: existingProject };
  }

  const [project] = await db
    .insert(projects)
    .values({ name: DEMO_PROJECT_NAME, userId: user.id })
    .returning();
  if (!project) throw new Error("Failed to create the demo project");

  await db.insert(feedbacks).values(
    SAMPLE_FEEDBACKS.map((sample) => ({
      projectId: project.id,
      message: sample.message,
      email: sample.email,
      rating: sample.rating,
      status: sample.status,
      createdAt: new Date(Date.now() - sample.daysAgo * 24 * 60 * 60 * 1000),
    })),
  );

  return { user, project };
}

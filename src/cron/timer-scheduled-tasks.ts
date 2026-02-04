import { handleScheduledTasks } from "../lambda/timer-handler.js";

const run = async () => {
  try {
    await handleScheduledTasks({} as any, {} as any);
  } catch (error) {
    console.error("Scheduled-tasks cron failed:", error);
    process.exit(1);
  }
};

run();

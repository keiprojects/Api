import { handleMidnightTimer } from "../lambda/timer-handler.js";

const run = async () => {
  try {
    await handleMidnightTimer({} as any, {} as any);
  } catch (error) {
    console.error("Midnight cron failed:", error);
    process.exit(1);
  }
};

run();

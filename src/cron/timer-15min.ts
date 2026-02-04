import { handle15MinTimer } from "../lambda/timer-handler.js";

const run = async () => {
  try {
    await handle15MinTimer({} as any, {} as any);
  } catch (error) {
    console.error("15-minute cron failed:", error);
    process.exit(1);
  }
};

run();

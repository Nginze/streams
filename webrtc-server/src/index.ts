import { logger } from "./config/logger";
import { main } from "./modules/main";

(async function () {
  try {
    await main();
  } catch (err) {
    logger.log({
      level: "error",
      message: `${err}`,
    });
  }
})();

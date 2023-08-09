import { logger } from "./config/logger";
import { main } from "./modules/main";
import "dotenv/config";

(async function () {
  try {
    await main();
  } catch (error) {
    logger.error(error);
  }
})();
